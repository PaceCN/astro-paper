---
author: wx
pubDatetime: 2026-05-11T23:35:00+08:00
title: 用 Python 做一个本地 PDF 工具集：PDF 转图片、图片合并 PDF
slug: python-pdf-image-toolkit-tkinter-2026-05-11
timezone: Asia/Shanghai
featured: false
draft: false
tags:
  - ai-automation
  - Python
  - PDF
  - Tkinter
  - PyMuPDF
  - Pillow
description: 这是一份基于 Python 的本地 PDF 工具源码，使用 Tkinter 做桌面界面，PyMuPDF 负责 PDF 页面渲染，Pillow 负责图片读取、预览和 PDF 合并。
---

最近整理了一个轻量级本地 PDF 工具集，功能很直接：

- 把 PDF 页面批量导出为 JPEG 图片。
- 把多张图片按顺序合并成 PDF。
- 支持图片预览、拖拽调整顺序、指定 PDF 页面尺寸。
- PDF 转图片支持全部、奇数页、偶数页和自定义页码范围。
- 支持限制导出图片最大宽高，避免输出图片过大。

它不是 Web 服务，也不依赖云端接口，更适合放在 Windows 桌面环境里当一个小工具使用。下面把技术架构、依赖栈和完整源码记录下来。

## 技术栈

这个工具的依赖很克制：

- **Python 3.10+**：主程序语言。
- **Tkinter / ttk**：Python 标准库自带 GUI，用来做窗口、按钮、列表、进度条和弹窗。
- **Pillow**：读取图片、处理 EXIF 旋转、透明背景转白底、生成预览图，以及在没有 PyMuPDF 时兜底合并图片到 PDF。
- **PyMuPDF / fitz**：读取 PDF、统计页数、把 PDF 页面渲染成图片，以及更稳定地把图片嵌入 PDF 页面。
- **threading + queue**：后台执行 PDF 提取和图片合并，避免长任务卡住 GUI 主线程。
- **ctypes**：Windows 下开启高 DPI awareness，让界面在高分屏上不至于发糊。

最小依赖文件可以这样写：

```txt title="requirements.txt"
Pillow>=10.0.0
PyMuPDF>=1.24.0
```

运行方式：

```bash
python -m pip install -r requirements.txt
python main.py
```

如果只使用“图片合并 PDF”，没有安装 PyMuPDF 时也能走 Pillow 兜底；但“PDF 转 JPEG”必须安装 PyMuPDF。

## 架构说明

这个程序可以拆成四层：

1. **GUI 层**：`PDFToolkitApp` 继承 `tk.Tk`，负责构建两个 Tab：PDF 转 JPEG、JPEG 转 PDF。
2. **文件输入层**：通过 `filedialog` 选择 PDF、图片文件或图片目录，并做扩展名过滤、自然排序和重复图片去重。
3. **转换处理层**：
   - PDF 转 JPEG：使用 `fitz.open()` 打开 PDF，用 `page.get_pixmap()` 渲染页面，再保存成 `.jpg`。
   - 图片转 PDF：优先使用 PyMuPDF 新建 PDF 页面并插入图片；如果没有 PyMuPDF，就用 Pillow 的 `save(..., "PDF")` 兜底。
4. **异步任务层**：耗时操作放进后台线程，子线程只把状态写入 `queue.Queue`，主线程通过 `after()` 轮询队列并更新 UI。

这里最重要的设计点是：**Tkinter UI 只能在主线程更新**。所以后台线程不直接操作控件，而是发送消息：

- `extract_progress`：PDF 页面导出进度。
- `extract_done`：导出结束。
- `extract_error`：导出失败。
- `jpeg_done`：图片合并完成。
- `jpeg_error`：图片合并失败。

这样可以避免 Tkinter 常见的跨线程 UI 崩溃问题。

## 功能流程

### PDF 转 JPEG

流程如下：

1. 选择 PDF 文件。
2. 用 PyMuPDF 读取页数。
3. 选择输出目录。
4. 解析页码范围，例如 `全部`、`奇数页`、`偶数页`、`1-3,5`。
5. 如果启用宽高限制，就计算渲染缩放比例。
6. 后台线程逐页渲染并保存为 `00000001.jpg` 这种稳定文件名。
7. 主线程更新进度条和日志。

### JPEG 转 PDF

流程如下：

1. 从目录导入或手动添加图片。
2. 按文件名自然排序，例如 `1.jpg`、`2.jpg`、`10.jpg` 会按数字顺序排列。
3. 支持拖拽调整图片顺序。
4. 支持预览选中图片。
5. 页面尺寸可以选择“与图片相同”、A4 或 Letter。
6. 后台线程合并并保存 PDF。

页面尺寸有两套单位：

- PyMuPDF 使用 PDF point，A4 约为 `595 x 842`。
- Pillow 兜底时使用 300 DPI 像素尺寸，A4 约为 `2480 x 3508`。

## 完整源码

保存为 `main.py`：

```python
from __future__ import annotations

import os
import queue
import threading
import ctypes
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageOps, ImageTk


APP_TITLE = "PDF工具集 v1.0.0"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

PAGE_SIZES_PT = {
    "A4 纵向": (595, 842),
    "A4 横向": (842, 595),
    "Letter 纵向": (612, 792),
    "Letter 横向": (792, 612),
}

PAGE_SIZES_PX_300 = {
    "A4 纵向": (2480, 3508),
    "A4 横向": (3508, 2480),
    "Letter 纵向": (2550, 3300),
    "Letter 横向": (3300, 2550),
}


@dataclass(frozen=True)
class ImageEntry:
    path: Path
    width: int
    height: int

    @property
    def size_text(self) -> str:
        return f"{self.width} x {self.height}"


def try_import_fitz():
    try:
        import fitz  # type: ignore
    except ImportError:
        return None
    return fitz


def enable_high_dpi_awareness() -> None:
    if os.name != "nt":
        return
    try:
        ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
    except Exception:
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(2)
        except Exception:
            pass


def natural_key(path: Path) -> list[object]:
    parts: list[object] = []
    token = ""
    for char in path.name:
        if char.isdigit():
            token += char
            continue
        if token:
            parts.append(int(token))
            token = ""
        parts.append(char.casefold())
    if token:
        parts.append(int(token))
    return parts


def parse_page_selection(selection: str, total_pages: int) -> list[int]:
    text = selection.strip()
    if not text or text == "全部":
        return list(range(total_pages))
    if text == "奇数页":
        return [i for i in range(total_pages) if (i + 1) % 2 == 1]
    if text == "偶数页":
        return [i for i in range(total_pages) if (i + 1) % 2 == 0]

    pages: set[int] = set()
    for part in text.replace("，", ",").split(","):
        item = part.strip()
        if not item:
            continue
        if "-" in item:
            start_text, end_text = item.split("-", 1)
            start = int(start_text.strip())
            end = int(end_text.strip())
            if start > end:
                start, end = end, start
            pages.update(range(start, end + 1))
        else:
            pages.add(int(item))

    invalid = [page for page in pages if page < 1 or page > total_pages]
    if invalid:
        raise ValueError(f"页码超出范围: {invalid[0]}")
    return [page - 1 for page in sorted(pages)]


def image_to_rgb(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, "white")
        background.paste(rgba, mask=rgba.getchannel("A"))
        return background
    return image.convert("RGB")


def fit_rect(page_width: float, page_height: float, image_width: int, image_height: int) -> tuple[float, float, float, float]:
    scale = min(page_width / image_width, page_height / image_height)
    fitted_width = image_width * scale
    fitted_height = image_height * scale
    left = (page_width - fitted_width) / 2
    top = (page_height - fitted_height) / 2
    return left, top, left + fitted_width, top + fitted_height


class PDFToolkitApp(tk.Tk):
    def __init__(self) -> None:
        enable_high_dpi_awareness()
        super().__init__()
        self.title(APP_TITLE)
        self.tk.call("tk", "scaling", self.winfo_fpixels("1i") / 72.0)
        self.geometry("820x540")
        self.minsize(820, 540)

        self.image_entries: list[ImageEntry] = []
        self.preview_photo: ImageTk.PhotoImage | None = None
        self.drag_iid: str | None = None

        self.extract_cancel_event = threading.Event()
        self.extract_thread: threading.Thread | None = None
        self.jpeg_thread: threading.Thread | None = None
        self.ui_queue: queue.Queue[tuple] = queue.Queue()

        self._configure_style()
        self._build_ui()
        self.after(100, self._poll_ui_queue)

    def _configure_style(self) -> None:
        style = ttk.Style(self)
        for theme in ("vista", "xpnative", "clam"):
            if theme in style.theme_names():
                style.theme_use(theme)
                break
        style.configure("Thin.TLabelframe", padding=6)
        style.configure("Tool.TButton", padding=(8, 2))

    def _build_ui(self) -> None:
        notebook = ttk.Notebook(self)
        notebook.pack(fill=tk.BOTH, expand=True, padx=7, pady=7)

        self.pdf_tab = ttk.Frame(notebook, padding=8)
        self.jpeg_tab = ttk.Frame(notebook, padding=8)

        notebook.add(self.pdf_tab, text="PDF转JPEG")
        notebook.add(self.jpeg_tab, text="JPEG转PDF")

        self._build_pdf_to_jpeg_tab(self.pdf_tab)
        self._build_jpeg_to_pdf_tab(self.jpeg_tab)
        notebook.select(self.jpeg_tab)

    def _build_jpeg_to_pdf_tab(self, parent: ttk.Frame) -> None:
        parent.columnconfigure(0, weight=1)
        parent.columnconfigure(1, weight=0)
        parent.rowconfigure(0, weight=1)

        list_frame = ttk.LabelFrame(parent, text="JPEG图片列表【可用鼠标拖拽运行，调整次序】", style="Thin.TLabelframe")
        list_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        list_frame.columnconfigure(0, weight=1)
        list_frame.rowconfigure(1, weight=1)

        toolbar = ttk.Frame(list_frame)
        toolbar.grid(row=0, column=0, sticky="ew", pady=(0, 6))

        ttk.Button(toolbar, text="从目录导入...", command=self.import_image_directory, style="Tool.TButton").pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(toolbar, text="添加...", command=self.add_images, style="Tool.TButton").pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(toolbar, text="移除", command=self.remove_selected_images, style="Tool.TButton").pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(toolbar, text="清空列表", command=self.clear_image_list, style="Tool.TButton").pack(side=tk.LEFT, padx=(0, 20))
        ttk.Label(toolbar, text="图片数量:").pack(side=tk.LEFT)
        self.image_count_var = tk.StringVar(value="0")
        ttk.Entry(toolbar, textvariable=self.image_count_var, width=8, justify=tk.CENTER, state="readonly").pack(side=tk.LEFT, padx=(6, 0))

        columns = ("index", "path", "size")
        self.image_tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="extended", height=14)
        self.image_tree.heading("index", text="序号")
        self.image_tree.heading("path", text="路径")
        self.image_tree.heading("size", text="宽高")
        self.image_tree.column("index", width=45, anchor=tk.CENTER, stretch=False)
        self.image_tree.column("path", width=250, anchor=tk.W)
        self.image_tree.column("size", width=90, anchor=tk.CENTER, stretch=False)

        tree_scroll = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.image_tree.yview)
        self.image_tree.configure(yscrollcommand=tree_scroll.set)
        self.image_tree.grid(row=1, column=0, sticky="nsew")
        tree_scroll.grid(row=1, column=1, sticky="ns")

        self.image_tree.bind("<<TreeviewSelect>>", self.on_image_selected)
        self.image_tree.bind("<Double-1>", self.open_selected_image)
        self.image_tree.bind("<ButtonPress-1>", self.on_tree_press)
        self.image_tree.bind("<B1-Motion>", self.on_tree_drag)

        bottom = ttk.Frame(list_frame)
        bottom.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(7, 0))
        bottom.columnconfigure(1, weight=1)

        ttk.Label(bottom, text="PDF页面设置:").grid(row=0, column=0, sticky="w")
        self.page_mode_var = tk.StringVar(value="与图片相同")
        page_mode = ttk.Combobox(
            bottom,
            textvariable=self.page_mode_var,
            values=("与图片相同", "A4 纵向", "A4 横向", "Letter 纵向", "Letter 横向"),
            width=14,
            state="readonly",
        )
        page_mode.grid(row=0, column=1, sticky="w", padx=(8, 0))
        self.merge_button = ttk.Button(bottom, text="合并到PDF文件...", command=self.merge_images_to_pdf, style="Tool.TButton")
        self.merge_button.grid(row=0, column=2, sticky="e")

        self.jpeg_status_var = tk.StringVar(value="")
        ttk.Label(bottom, textvariable=self.jpeg_status_var, anchor=tk.W).grid(row=1, column=0, columnspan=3, sticky="ew", pady=(4, 0))

        preview_frame = ttk.LabelFrame(parent, text="预览【双击，可使用本地程序打开图片】", style="Thin.TLabelframe")
        preview_frame.grid(row=0, column=1, sticky="nsew")
        preview_frame.rowconfigure(0, weight=1)
        preview_frame.columnconfigure(0, weight=1)

        self.preview_canvas = tk.Canvas(preview_frame, width=270, height=370, bg="#777777", highlightthickness=0)
        self.preview_canvas.grid(row=0, column=0, sticky="nsew")
        self.preview_canvas.bind("<Double-1>", self.open_selected_image)

    def _build_pdf_to_jpeg_tab(self, parent: ttk.Frame) -> None:
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=0)
        parent.rowconfigure(1, weight=1)

        top = ttk.LabelFrame(parent, text="提取PDF页面到JPEG图片:", style="Thin.TLabelframe")
        top.grid(row=0, column=0, sticky="ew")
        for column in (1, 4):
            top.columnconfigure(column, weight=1)

        self.pdf_file_var = tk.StringVar()
        self.page_count_var = tk.StringVar(value="0")
        self.output_dir_var = tk.StringVar()
        self.page_selection_var = tk.StringVar(value="全部")
        self.limit_enabled_var = tk.BooleanVar(value=False)
        self.limit_width_var = tk.StringVar(value="967")
        self.limit_height_var = tk.StringVar(value="1297")

        ttk.Label(top, text="PDF文件:").grid(row=0, column=0, sticky="w", pady=(8, 5))
        ttk.Entry(top, textvariable=self.pdf_file_var, state="readonly").grid(row=0, column=1, columnspan=3, sticky="ew", padx=(8, 5), pady=(8, 5))
        ttk.Button(top, text="...", width=4, command=self.browse_pdf_file).grid(row=0, column=4, sticky="w", pady=(8, 5))
        ttk.Button(top, text="关闭文件", command=self.close_pdf_file, style="Tool.TButton").grid(row=0, column=5, sticky="e", padx=(12, 0), pady=(8, 5))

        ttk.Label(top, text="页面数量:").grid(row=1, column=0, sticky="w", pady=5)
        ttk.Entry(top, textvariable=self.page_count_var, width=20, justify=tk.CENTER, state="readonly").grid(row=1, column=1, sticky="w", padx=(8, 0), pady=5)
        ttk.Label(top, text="提取的页面:").grid(row=1, column=3, sticky="e", pady=5)
        ttk.Combobox(
            top,
            textvariable=self.page_selection_var,
            values=("全部", "奇数页", "偶数页", "1-3,5"),
            width=24,
        ).grid(row=1, column=4, columnspan=2, sticky="ew", pady=5)

        limit = ttk.Checkbutton(top, text="限制图片的最大宽高(为 0 或 空 时，忽略):", variable=self.limit_enabled_var, command=self.toggle_limit_entries)
        limit.grid(row=2, column=0, columnspan=4, sticky="w", pady=5)
        limit_values = ttk.Frame(top)
        limit_values.grid(row=2, column=4, columnspan=2, sticky="e", pady=5)
        ttk.Label(limit_values, text="宽").pack(side=tk.LEFT)
        self.limit_width_entry = ttk.Entry(limit_values, textvariable=self.limit_width_var, width=7, justify=tk.CENTER, state="disabled")
        self.limit_width_entry.pack(side=tk.LEFT, padx=(5, 10))
        ttk.Label(limit_values, text="高").pack(side=tk.LEFT)
        self.limit_height_entry = ttk.Entry(limit_values, textvariable=self.limit_height_var, width=7, justify=tk.CENTER, state="disabled")
        self.limit_height_entry.pack(side=tk.LEFT, padx=(5, 0))

        ttk.Label(top, text="输出目录:").grid(row=3, column=0, sticky="w", pady=5)
        ttk.Entry(top, textvariable=self.output_dir_var, state="readonly").grid(row=3, column=1, columnspan=4, sticky="ew", padx=(8, 5), pady=5)
        ttk.Button(top, text="...", width=4, command=self.browse_output_dir).grid(row=3, column=5, sticky="e", pady=5)

        separator = ttk.Separator(top)
        separator.grid(row=4, column=0, columnspan=6, sticky="ew", pady=(8, 8))

        ttk.Label(top, text="提取操作:").grid(row=5, column=0, sticky="w", pady=(0, 8))
        self.extract_progress = tk.Canvas(top, height=18, bg="white", highlightthickness=1, highlightbackground="#b5b5b5")
        self.extract_progress.grid(row=5, column=1, columnspan=4, sticky="ew", padx=(8, 12), pady=(0, 8))
        self.extract_progress.bind("<Configure>", lambda _event: self.draw_progress(0, 1))
        extract_buttons = ttk.Frame(top)
        extract_buttons.grid(row=5, column=5, sticky="e", pady=(0, 8))
        self.start_extract_button = ttk.Button(extract_buttons, text="开始提取", command=self.start_extract, style="Tool.TButton")
        self.start_extract_button.pack(side=tk.LEFT, padx=(0, 6))
        self.cancel_extract_button = ttk.Button(extract_buttons, text="取消提取", command=self.cancel_extract, state="disabled", style="Tool.TButton")
        self.cancel_extract_button.pack(side=tk.LEFT)

        log_frame = ttk.LabelFrame(parent, text="日志信息", style="Thin.TLabelframe")
        log_frame.grid(row=1, column=0, sticky="nsew", pady=(7, 0))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)

        self.log_text = tk.Text(log_frame, height=8, wrap=tk.NONE, bg="#eeeeee", relief=tk.SUNKEN, bd=1)
        log_scroll = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)
        self.log_text.grid(row=0, column=0, sticky="nsew")
        log_scroll.grid(row=0, column=1, sticky="ns")
        self.draw_progress(0, 1)

    def import_image_directory(self) -> None:
        directory = filedialog.askdirectory(title="选择图片目录")
        if not directory:
            return
        paths = sorted(
            (path for path in Path(directory).iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS),
            key=natural_key,
        )
        self.append_image_paths(paths)

    def add_images(self) -> None:
        filetypes = [
            ("图片文件", "*.jpg;*.jpeg;*.png;*.bmp;*.tif;*.tiff;*.webp"),
            ("所有文件", "*.*"),
        ]
        filenames = filedialog.askopenfilenames(title="添加图片", filetypes=filetypes)
        if filenames:
            self.append_image_paths(Path(filename) for filename in filenames)

    def append_image_paths(self, paths: Iterable[Path]) -> None:
        existing = {entry.path.resolve() for entry in self.image_entries}
        added = 0
        skipped = 0
        for path in paths:
            try:
                resolved = path.resolve()
                if resolved in existing:
                    skipped += 1
                    continue
                with Image.open(resolved) as image:
                    width, height = image.size
                self.image_entries.append(ImageEntry(resolved, width, height))
                existing.add(resolved)
                added += 1
            except Exception:
                skipped += 1
        self.refresh_image_tree()
        if added:
            self.jpeg_status_var.set(f"已添加 {added} 张图片。")
        elif skipped:
            self.jpeg_status_var.set("没有可添加的图片。")

    def refresh_image_tree(self) -> None:
        for iid in self.image_tree.get_children():
            self.image_tree.delete(iid)
        for index, entry in enumerate(self.image_entries, start=1):
            self.image_tree.insert("", tk.END, iid=str(index - 1), values=(index, str(entry.path), entry.size_text))
        self.image_count_var.set(str(len(self.image_entries)))
        if not self.image_entries:
            self.preview_canvas.delete("all")

    def on_image_selected(self, _event: tk.Event | None = None) -> None:
        selection = self.image_tree.selection()
        if not selection:
            return
        index = int(selection[0])
        if 0 <= index < len(self.image_entries):
            self.show_preview(self.image_entries[index].path)

    def show_preview(self, path: Path) -> None:
        self.preview_canvas.delete("all")
        width = max(self.preview_canvas.winfo_width(), 270)
        height = max(self.preview_canvas.winfo_height(), 370)
        self.preview_canvas.create_rectangle(0, 0, width, height, fill="#777777", outline="")
        try:
            with Image.open(path) as image:
                image = ImageOps.exif_transpose(image)
                image.thumbnail((width - 22, height - 22), Image.Resampling.LANCZOS)
                preview = image.copy()
            self.preview_photo = ImageTk.PhotoImage(preview)
            self.preview_canvas.create_image(width / 2, height / 2, image=self.preview_photo, anchor=tk.CENTER)
        except Exception as exc:
            self.preview_canvas.create_text(width / 2, height / 2, text=f"无法预览\n{exc}", fill="white", justify=tk.CENTER)

    def remove_selected_images(self) -> None:
        selected_indices = sorted((int(iid) for iid in self.image_tree.selection()), reverse=True)
        for index in selected_indices:
            if 0 <= index < len(self.image_entries):
                self.image_entries.pop(index)
        self.refresh_image_tree()
        self.jpeg_status_var.set(f"已移除 {len(selected_indices)} 张图片。")

    def clear_image_list(self) -> None:
        self.image_entries.clear()
        self.refresh_image_tree()
        self.jpeg_status_var.set("列表已清空。")

    def on_tree_press(self, event: tk.Event) -> None:
        iid = self.image_tree.identify_row(event.y)
        self.drag_iid = iid or None

    def on_tree_drag(self, event: tk.Event) -> None:
        if not self.drag_iid:
            return
        target_iid = self.image_tree.identify_row(event.y)
        if not target_iid or target_iid == self.drag_iid:
            return
        source_index = int(self.drag_iid)
        target_index = int(target_iid)
        if not (0 <= source_index < len(self.image_entries) and 0 <= target_index < len(self.image_entries)):
            return
        entry = self.image_entries.pop(source_index)
        self.image_entries.insert(target_index, entry)
        self.refresh_image_tree()
        self.drag_iid = str(target_index)
        self.image_tree.selection_set(self.drag_iid)
        self.image_tree.focus(self.drag_iid)

    def open_selected_image(self, _event: tk.Event | None = None) -> None:
        selection = self.image_tree.selection()
        if not selection:
            return
        index = int(selection[0])
        if 0 <= index < len(self.image_entries):
            os.startfile(self.image_entries[index].path)

    def merge_images_to_pdf(self) -> None:
        if not self.image_entries:
            messagebox.showwarning("没有图片", "请先添加要合并的图片。")
            return
        output = filedialog.asksaveasfilename(
            title="保存PDF文件",
            defaultextension=".pdf",
            filetypes=[("PDF文件", "*.pdf")],
        )
        if not output:
            return
        paths = [entry.path for entry in self.image_entries]
        page_mode = self.page_mode_var.get()
        self.merge_button.configure(state="disabled")
        self.jpeg_status_var.set("正在合并PDF...")
        self.jpeg_thread = threading.Thread(target=self._merge_worker, args=(paths, Path(output), page_mode), daemon=True)
        self.jpeg_thread.start()

    def _merge_worker(self, paths: list[Path], output: Path, page_mode: str) -> None:
        try:
            fitz = try_import_fitz()
            if fitz is not None:
                self._merge_with_pymupdf(fitz, paths, output, page_mode)
            else:
                self._merge_with_pillow(paths, output, page_mode)
            self.ui_queue.put(("jpeg_done", str(output)))
        except Exception as exc:
            self.ui_queue.put(("jpeg_error", str(exc)))

    def _merge_with_pymupdf(self, fitz, paths: list[Path], output: Path, page_mode: str) -> None:
        document = fitz.open()
        try:
            for path in paths:
                with Image.open(path) as image:
                    image = ImageOps.exif_transpose(image)
                    image_width, image_height = image.size
                if page_mode == "与图片相同":
                    page_width, page_height = image_width, image_height
                else:
                    page_width, page_height = PAGE_SIZES_PT[page_mode]
                page = document.new_page(width=page_width, height=page_height)
                rect = fitz.Rect(*fit_rect(page_width, page_height, image_width, image_height))
                page.insert_image(rect, filename=str(path), keep_proportion=True)
            document.save(output)
        finally:
            document.close()

    def _merge_with_pillow(self, paths: list[Path], output: Path, page_mode: str) -> None:
        pages: list[Image.Image] = []
        for path in paths:
            with Image.open(path) as image:
                rgb = image_to_rgb(image)
            if page_mode != "与图片相同":
                page_width, page_height = PAGE_SIZES_PX_300[page_mode]
                canvas = Image.new("RGB", (page_width, page_height), "white")
                fitted = ImageOps.contain(rgb, (page_width, page_height), Image.Resampling.LANCZOS)
                left = (page_width - fitted.width) // 2
                top = (page_height - fitted.height) // 2
                canvas.paste(fitted, (left, top))
                rgb = canvas
            pages.append(rgb)
        if not pages:
            raise RuntimeError("没有可合并的图片。")
        resolution = 72.0 if page_mode == "与图片相同" else 300.0
        first, rest = pages[0], pages[1:]
        first.save(output, "PDF", resolution=resolution, save_all=True, append_images=rest)
        for page in pages:
            page.close()

    def browse_pdf_file(self) -> None:
        filename = filedialog.askopenfilename(title="选择PDF文件", filetypes=[("PDF文件", "*.pdf"), ("所有文件", "*.*")])
        if not filename:
            return
        fitz = try_import_fitz()
        if fitz is None:
            self.show_missing_pymupdf()
            self.pdf_file_var.set(filename)
            return
        try:
            with fitz.open(filename) as document:
                self.page_count_var.set(str(document.page_count))
            self.pdf_file_var.set(filename)
            default_output = Path(filename).with_suffix("")
            self.output_dir_var.set(str(default_output))
            self.log(f"打开PDF: {filename}")
        except Exception as exc:
            messagebox.showerror("打开失败", f"无法打开PDF文件:\n{exc}")

    def close_pdf_file(self) -> None:
        self.pdf_file_var.set("")
        self.page_count_var.set("0")
        self.output_dir_var.set("")
        self.page_selection_var.set("全部")
        self.draw_progress(0, 1)
        self.log("已关闭PDF文件。")

    def browse_output_dir(self) -> None:
        directory = filedialog.askdirectory(title="选择输出目录")
        if directory:
            self.output_dir_var.set(directory)

    def toggle_limit_entries(self) -> None:
        state = "normal" if self.limit_enabled_var.get() else "disabled"
        self.limit_width_entry.configure(state=state)
        self.limit_height_entry.configure(state=state)

    def start_extract(self) -> None:
        pdf_path = self.pdf_file_var.get().strip()
        output_dir = self.output_dir_var.get().strip()
        if not pdf_path:
            messagebox.showwarning("缺少PDF", "请先选择PDF文件。")
            return
        if not output_dir:
            messagebox.showwarning("缺少目录", "请选择输出目录。")
            return
        fitz = try_import_fitz()
        if fitz is None:
            self.show_missing_pymupdf()
            return
        try:
            total_pages = int(self.page_count_var.get())
            page_indices = parse_page_selection(self.page_selection_var.get(), total_pages)
            if not page_indices:
                raise ValueError("没有可提取的页面。")
            limit_width = self.parse_optional_int(self.limit_width_var.get())
            limit_height = self.parse_optional_int(self.limit_height_var.get())
        except Exception as exc:
            messagebox.showerror("参数错误", str(exc))
            return

        Path(output_dir).mkdir(parents=True, exist_ok=True)
        self.extract_cancel_event.clear()
        self.start_extract_button.configure(state="disabled")
        self.cancel_extract_button.configure(state="normal")
        self.draw_progress(0, len(page_indices))
        self.log("开始提取PDF页面...")

        self.extract_thread = threading.Thread(
            target=self._extract_worker,
            args=(
                fitz,
                Path(pdf_path),
                Path(output_dir),
                page_indices,
                self.limit_enabled_var.get(),
                limit_width,
                limit_height,
            ),
            daemon=True,
        )
        self.extract_thread.start()

    def _extract_worker(
        self,
        fitz,
        pdf_path: Path,
        output_dir: Path,
        page_indices: list[int],
        limit_enabled: bool,
        limit_width: int | None,
        limit_height: int | None,
    ) -> None:
        completed = 0
        cancelled = False
        try:
            document = fitz.open(pdf_path)
            try:
                total = len(page_indices)
                for page_index in page_indices:
                    if self.extract_cancel_event.is_set():
                        cancelled = True
                        break
                    page = document.load_page(page_index)
                    zoom = self.compute_zoom(page, limit_enabled, limit_width, limit_height)
                    pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                    output = output_dir / f"{page_index + 1:08d}.jpg"
                    pixmap.save(output)
                    completed += 1
                    self.ui_queue.put(("extract_progress", completed, total, str(output)))
            finally:
                document.close()
            self.ui_queue.put(("extract_done", cancelled, completed, len(page_indices)))
        except Exception as exc:
            self.ui_queue.put(("extract_error", str(exc)))

    @staticmethod
    def compute_zoom(page, limit_enabled: bool, limit_width: int | None, limit_height: int | None) -> float:
        page_width = float(page.rect.width)
        page_height = float(page.rect.height)
        zoom = 1.0
        if limit_enabled:
            width = page_width * zoom
            height = page_height * zoom
            factors: list[float] = []
            if limit_width and width > limit_width:
                factors.append(limit_width / width)
            if limit_height and height > limit_height:
                factors.append(limit_height / height)
            if factors:
                zoom *= min(factors)
        return max(zoom, 0.05)

    @staticmethod
    def parse_optional_int(value: str) -> int | None:
        text = value.strip()
        if not text:
            return None
        number = int(text)
        return number if number > 0 else None

    def cancel_extract(self) -> None:
        self.extract_cancel_event.set()
        self.cancel_extract_button.configure(state="disabled")
        self.log("正在取消，请稍候...")

    def draw_progress(self, current: int, total: int) -> None:
        total = max(total, 1)
        width = max(self.extract_progress.winfo_width(), 1)
        height = max(self.extract_progress.winfo_height(), 18)
        ratio = min(max(current / total, 0), 1)
        self.extract_progress.delete("all")
        self.extract_progress.create_rectangle(0, 0, width, height, fill="white", outline="")
        self.extract_progress.create_rectangle(0, 0, width * ratio, height, fill="#00b92e", outline="")
        text = f"进度: [ {current} / {total} ] {ratio:.0%}"
        self.extract_progress.create_text(width / 2, height / 2, text=text, fill="white" if ratio > 0.35 else "black")

    def log(self, message: str) -> None:
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)

    def show_missing_pymupdf(self) -> None:
        messagebox.showerror(
            "缺少依赖",
            "PDF转JPEG需要 PyMuPDF。\n\n请在 PDF 文件夹中运行:\npython -m pip install -r requirements.txt",
        )

    def _poll_ui_queue(self) -> None:
        try:
            while True:
                message = self.ui_queue.get_nowait()
                kind = message[0]
                if kind == "extract_progress":
                    _, current, total, output = message
                    self.draw_progress(current, total)
                    self.log(f"输出图片: {output}")
                elif kind == "extract_done":
                    _, cancelled, completed, total = message
                    self.start_extract_button.configure(state="normal")
                    self.cancel_extract_button.configure(state="disabled")
                    self.draw_progress(completed, total)
                    if cancelled:
                        self.log(f"已取消，已输出 {completed} 张图片。")
                    else:
                        self.log(f"提取完成，共输出 {completed} 张图片。")
                elif kind == "extract_error":
                    _, error = message
                    self.start_extract_button.configure(state="normal")
                    self.cancel_extract_button.configure(state="disabled")
                    messagebox.showerror("提取失败", error)
                    self.log(f"提取失败: {error}")
                elif kind == "jpeg_done":
                    _, output = message
                    self.merge_button.configure(state="normal")
                    self.jpeg_status_var.set(f"合并完成: {output}")
                    messagebox.showinfo("合并完成", f"PDF文件已保存:\n{output}")
                elif kind == "jpeg_error":
                    _, error = message
                    self.merge_button.configure(state="normal")
                    self.jpeg_status_var.set("合并失败。")
                    messagebox.showerror("合并失败", error)
        except queue.Empty:
            pass
        self.after(100, self._poll_ui_queue)


if __name__ == "__main__":
    app = PDFToolkitApp()
    app.mainloop()
```

## 后续可以继续补的点

这个版本已经够日常使用，但如果要继续产品化，我会优先补这几项：

- **跨平台打开文件**：当前 `os.startfile()` 只适合 Windows，macOS/Linux 可以改成 `open` / `xdg-open`。
- **PDF 输出质量选项**：PDF 转 JPEG 可以增加 DPI 或质量参数，而不是只靠最大宽高控制。
- **打包发布**：用 PyInstaller 打成 exe，并把 `requirements.txt`、图标、版本号一起纳入发布流程。
- **错误日志文件**：除了界面日志，也可以把异常写到本地 log，方便定位用户环境问题。
- **批量任务队列**：支持一次选择多个 PDF，自动按文件夹导出。

作为一个本地桌面小工具，它的优势是简单、可控、离线可用。PDF 转图片交给 PyMuPDF，图片处理交给 Pillow，界面交给 Tkinter，整体维护成本不高，也很适合后续继续封装成 Windows 绿色工具。
