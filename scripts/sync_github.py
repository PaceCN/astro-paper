#!/usr/bin/env python3
"""
GitHub sync helper for Windows.

This script does not require GitHub CLI. By default it uses a GitHub personal
access token that you paste once and store locally beside this script. A browser
login mode through Git Credential Manager is still available with
--auth browser.
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from datetime import datetime
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "github_sync_profiles.json"
STATE_PATH = SCRIPT_DIR / "github_sync_state.json"
GITHUB_HOST = "github.com"
TOKEN_URL = "https://github.com/settings/personal-access-tokens/new"


def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    sys.exit(1)


def ask(question: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{question}{suffix}: ").strip()
    return value or default


def confirm(question: str, default: bool = True) -> bool:
    suffix = "Y/n" if default else "y/N"
    value = input(f"{question} ({suffix}): ").strip().lower()
    if not value:
        return default
    return value in {"y", "yes", "是", "好", "1", "true"}


def quote_command(command: list[str]) -> str:
    return " ".join(f'"{part}"' if " " in part else part for part in command)


def askpass() -> None:
    prompt = " ".join(sys.argv[2:])
    if "username" in prompt.lower():
        print(os.environ.get("GITHUB_SYNC_USERNAME", "x-access-token"))
    else:
        print(os.environ.get("GITHUB_SYNC_TOKEN", ""))
    sys.exit(0)


def run(
    command: list[str],
    *,
    check: bool = True,
    dry_run: bool = False,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess:
    print(quote_command(command))
    if dry_run:
        return subprocess.CompletedProcess(command, 0)
    result = subprocess.run(command, cwd=ROOT, env=env)
    if check and result.returncode != 0:
        fail(f"Command failed: {quote_command(command)}")
    return result


def capture(command: list[str], env: dict[str, str] | None = None) -> tuple[int, str, str]:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, env=env)
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def ensure_git(auto_install: bool) -> None:
    if shutil.which("git"):
        return

    print("未检测到 Git。同步到 GitHub 需要安装 Git for Windows。")
    if not auto_install and not confirm("是否尝试自动安装 Git for Windows？"):
        fail("请先安装 Git for Windows，然后重新运行脚本。")

    if not shutil.which("winget"):
        webbrowser.open("https://git-scm.com/download/win")
        fail("未检测到 winget，已打开 Git 下载页。安装完成后重新运行脚本。")

    run(["winget", "install", "--id", "Git.Git", "-e", "--source", "winget"], check=False)
    fail("Git 安装命令已执行。如果这是首次安装，请重新打开终端后再运行脚本。")


def ensure_credential_manager(auto_install: bool) -> None:
    code, out, err = capture(["git", "credential-manager", "--version"])
    if code == 0:
        return

    code, out, err = capture(["git-credential-manager", "--version"])
    if code == 0:
        return

    print("未检测到 Git Credential Manager。没有它，HTTPS 推送时无法稳定弹出 GitHub 浏览器登录。")
    if auto_install or confirm("是否尝试通过 winget 更新/安装 Git for Windows？"):
        if shutil.which("winget"):
            run(["winget", "install", "--id", "Git.Git", "-e", "--source", "winget"], check=False)
            print("安装/更新命令已执行。如果仍提示缺失，请重新打开终端后再运行。")
            return
        webbrowser.open("https://git-scm.com/download/win")
        fail("未检测到 winget，已打开 Git 下载页。安装时请勾选 Git Credential Manager。")

    fail("请安装带 Git Credential Manager 的 Git for Windows 后重试。")


def token_help(account: str, repo: str) -> None:
    print("\n需要为目标 GitHub 账号创建一个 Fine-grained personal access token。")
    print("建议用无痕窗口打开下面的地址，并登录拥有该仓库的 GitHub 账号：")
    print(f"  {TOKEN_URL}")
    print("\n创建时建议这样选：")
    print(f"  Resource owner: {account}")
    print(f"  Repository access: Only select repositories -> {repo}")
    print("  Repository permissions: Contents -> Read and write")
    print("\n创建后复制 token，回到这里粘贴。token 只会保存在 scripts/github_sync_state.json。")


def normalize_repo(value: str) -> str:
    raw = value.strip().removesuffix(".git")
    if raw.startswith("https://github.com/"):
        raw = raw.removeprefix("https://github.com/")
    elif raw.startswith("http://github.com/"):
        raw = raw.removeprefix("http://github.com/")
    elif raw.startswith("git@github.com:"):
        raw = raw.removeprefix("git@github.com:")
    raw = raw.strip("/")
    if raw.count("/") != 1:
        fail("仓库格式应为 owner/repo，例如 pace/blog。")
    return raw


def profile_remote_url(account: str, repo: str) -> str:
    safe_account = urllib.parse.quote(account, safe="")
    return f"https://{safe_account}@{GITHUB_HOST}/{repo}.git"


def load_json(path: Path, default: dict) -> dict:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def github_request(path_or_url: str, token: str | None = None) -> dict:
    url = path_or_url if path_or_url.startswith("https://") else f"https://api.github.com{path_or_url}"
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def github_user_id(account: str) -> str:
    url = f"https://api.github.com/users/{urllib.parse.quote(account)}"
    try:
        return str(github_request(url).get("id") or "")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return ""


def default_commit_email(account: str) -> str:
    user_id = github_user_id(account)
    if user_id:
        return f"{user_id}+{account}@users.noreply.github.com"
    return f"{account}@users.noreply.github.com"


def setup_profile(profile_name: str) -> dict:
    print("\n首次配置 GitHub 同步 profile。只需要填写 GitHub 用户名和仓库。")
    account = ask("GitHub 用户名 account")
    repo = normalize_repo(ask("仓库 repo，例如 owner/repo 或完整 GitHub URL"))
    branch = ask("分支 branch", "main")
    remote_name = ask("本地 remote 名称", f"github-{profile_name}")
    commit_name = ask("提交显示名称", account)
    commit_email = ask("提交邮箱", default_commit_email(account))

    return {
        "account": account,
        "repo": repo,
        "branch": branch,
        "remoteName": remote_name,
        "commitName": commit_name,
        "commitEmail": commit_email,
    }


def load_or_create_profile(profile_name: str, force_setup: bool) -> dict:
    config = load_json(CONFIG_PATH, {"profiles": {}})
    profiles = config.setdefault("profiles", {})
    profile = profiles.get(profile_name)

    if force_setup or not profile:
        profile = setup_profile(profile_name)
        profiles[profile_name] = profile
        save_json(CONFIG_PATH, config)
        print(f"\n已保存 profile 到 {CONFIG_PATH}")

    return profile


def token_state(profile_name: str) -> dict:
    state = load_json(STATE_PATH, {})
    return state.setdefault("tokens", {}).setdefault(profile_name, {})


def save_token(profile_name: str, token: str, login: str, user_id: str) -> None:
    state = load_json(STATE_PATH, {})
    tokens = state.setdefault("tokens", {})
    tokens[profile_name] = {
        "token": token,
        "login": login,
        "userId": user_id,
        "savedAt": datetime.now().isoformat(timespec="seconds"),
    }
    save_json(STATE_PATH, state)


def clear_token(profile_name: str) -> None:
    state = load_json(STATE_PATH, {})
    tokens = state.setdefault("tokens", {})
    if profile_name in tokens:
        del tokens[profile_name]
        save_json(STATE_PATH, state)


def update_profile_account(profile_name: str, account: str) -> None:
    config = load_json(CONFIG_PATH, {"profiles": {}})
    profiles = config.setdefault("profiles", {})
    profile = profiles.setdefault(profile_name, {})
    profile["account"] = account
    save_json(CONFIG_PATH, config)


def validate_token(token: str, account: str) -> tuple[bool, str, str]:
    try:
        data = github_request("/user", token)
    except urllib.error.HTTPError as error:
        if error.code in {401, 403}:
            return False, "", ""
        raise
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return False, "", ""

    login = str(data.get("login") or "")
    user_id = str(data.get("id") or "")
    return login.lower() == account.lower(), login, user_id


def get_or_create_token(profile_name: str, account: str, repo: str, reset: bool) -> tuple[str, str, str]:
    if reset:
        clear_token(profile_name)

    saved = token_state(profile_name)
    token = str(saved.get("token", "")).strip()

    if token:
        valid, login, user_id = validate_token(token, account)
        if valid:
            return token, login, user_id
        print("\n已保存的 token 无效、过期，或不属于当前 profile 的 GitHub 账号。")
        clear_token(profile_name)

    token_help(account, repo)
    if confirm("是否打开 token 创建页面？如果默认浏览器是主账号，请选 No 后手动复制链接到无痕窗口", default=False):
        webbrowser.open(TOKEN_URL)

    while True:
        token = getpass.getpass("粘贴 GitHub token（输入时不显示）: ").strip()
        if not token:
            print("token 不能为空。")
            continue
        valid, login, user_id = validate_token(token, account)
        if valid:
            save_token(profile_name, token, login, user_id)
            return token, login, user_id
        if login:
            print(f"这个 token 属于 GitHub 账号 '{login}'，但当前 profile 需要 '{account}'。")
            if confirm(f"是否把当前 profile 的 account 改成 '{login}' 并继续？", default=True):
                update_profile_account(profile_name, login)
                save_token(profile_name, token, login, user_id)
                return token, login, user_id
        else:
            print("token 无效，或没有权限读取当前用户信息。请重新创建并粘贴。")


def make_askpass_env(account: str, token: str) -> tuple[dict[str, str], tempfile.TemporaryDirectory]:
    temp_dir = tempfile.TemporaryDirectory(prefix="github-sync-askpass-")
    askpass_path = Path(temp_dir.name) / "askpass.cmd"
    python_exe = sys.executable
    script = Path(__file__).resolve()
    askpass_path.write_text(
        f'@echo off\r\n"{python_exe}" "{script}" --askpass %*\r\n',
        encoding="utf-8",
    )
    env = os.environ.copy()
    env["GIT_ASKPASS"] = str(askpass_path)
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GITHUB_SYNC_USERNAME"] = account
    env["GITHUB_SYNC_TOKEN"] = token
    return env, temp_dir


def ensure_gitignore_entries() -> None:
    entries = ["scripts/github_sync_profiles.json", "scripts/github_sync_state.json"]
    gitignore = ROOT / ".gitignore"
    existing = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    missing = [entry for entry in entries if entry not in existing]
    if missing:
        with gitignore.open("a", encoding="utf-8") as file:
            if existing and not existing.endswith("\n"):
                file.write("\n")
            file.write("\n# local GitHub sync files\n")
            for entry in missing:
                file.write(f"{entry}\n")


def ensure_local_exclude() -> None:
    exclude = ROOT / ".git" / "info" / "exclude"
    if not exclude.exists():
        return
    entries = ["/scripts/github_sync_profiles.json", "/scripts/github_sync_state.json"]
    existing = exclude.read_text(encoding="utf-8")
    missing = [entry for entry in entries if entry not in existing]
    if missing:
        with exclude.open("a", encoding="utf-8") as file:
            if existing and not existing.endswith("\n"):
                file.write("\n")
            file.write("# local GitHub sync files\n")
            for entry in missing:
                file.write(f"{entry}\n")


def ensure_repo(init: bool, dry_run: bool) -> None:
    code, out, err = capture(["git", "rev-parse", "--is-inside-work-tree"])
    if out == "true":
        ensure_local_exclude()
        return

    if not init and not confirm("当前目录还不是 Git 仓库，是否执行 git init？"):
        fail("未初始化 Git 仓库，无法同步。")

    run(["git", "init"], dry_run=dry_run)
    ensure_local_exclude()


def git_output(command: list[str]) -> str:
    code, out, err = capture(command)
    return out if code == 0 else ""


def ensure_remote(remote_name: str, remote_url: str, dry_run: bool, update_remote: bool) -> None:
    existing = git_output(["git", "remote", "get-url", remote_name])
    if not existing:
        run(["git", "remote", "add", remote_name, remote_url], dry_run=dry_run)
        return

    if existing == remote_url:
        return

    print(f"remote '{remote_name}' 当前指向：{existing}")
    print(f"当前 profile 需要指向：{remote_url}")
    if not update_remote and not confirm("是否更新这个 remote？", default=False):
        fail("remote URL 不匹配，为避免账号串用已停止。")
    run(["git", "remote", "set-url", remote_name, remote_url], dry_run=dry_run)


def remote_branch_exists(remote_name: str, branch: str, env: dict[str, str] | None = None) -> bool:
    code, out, err = capture(["git", "ls-remote", "--heads", remote_name, branch], env=env)
    return code == 0 and bool(out)


def has_staged_changes() -> bool:
    result = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT)
    return result.returncode != 0


def reset_login(account: str, repo: str, dry_run: bool) -> None:
    credential = f"protocol=https\nhost={GITHUB_HOST}\nusername={account}\npath={repo}.git\n\n"
    print("git credential reject")
    if dry_run:
        return
    subprocess.run(["git", "credential", "reject"], cwd=ROOT, text=True, input=credential, check=False)
    print("已请求清除当前 profile 的 GitHub 凭据。下一次访问远端时会重新弹出登录。")


def save_state(profile_name: str, profile: dict, remote_url: str) -> None:
    state = load_json(STATE_PATH, {})
    state.update(
        {
            "lastProfile": profile_name,
            "lastAccount": profile["account"],
            "lastRepo": profile["repo"],
            "lastRemoteUrl": remote_url,
            "lastSyncAt": datetime.now().isoformat(timespec="seconds"),
        }
    )
    save_json(STATE_PATH, state)


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "--askpass":
        askpass()

    parser = argparse.ArgumentParser(description="同步当前项目到 GitHub，不依赖 GitHub CLI。")
    parser.add_argument("-p", "--profile", default="personal", help="本地同步 profile 名称，默认 personal。")
    parser.add_argument("-m", "--message", help="提交信息。")
    parser.add_argument("-b", "--branch", help="覆盖 profile 里的分支。")
    parser.add_argument("--setup", action="store_true", help="重新配置当前 profile。")
    parser.add_argument("--auth", choices=["token", "browser"], default="token", help="认证方式：token 为手动 token，browser 为 Git Credential Manager 浏览器登录。")
    parser.add_argument("--init", action="store_true", help="如果当前目录不是 Git 仓库，则自动 git init。")
    parser.add_argument("--no-pull", action="store_true", help="跳过 push 前的 pull --rebase。")
    parser.add_argument("--update-remote", action="store_true", help="允许更新已存在但 URL 不同的 remote。")
    parser.add_argument("--reset-login", action="store_true", help="清除当前 profile 对应的缓存登录，强制重新登录。")
    parser.add_argument("--auto-install", action="store_true", help="环境缺失时尝试自动安装。")
    parser.add_argument("--dry-run", action="store_true", help="只打印将执行的命令，不修改本地仓库。")
    args = parser.parse_args()

    ensure_git(args.auto_install)
    if args.auth == "browser":
        ensure_credential_manager(args.auto_install)
    ensure_gitignore_entries()

    profile = load_or_create_profile(args.profile, args.setup)
    account = str(profile.get("account", "")).strip()
    repo = normalize_repo(str(profile.get("repo", "")).strip())
    branch = args.branch or str(profile.get("branch", "main")).strip() or "main"
    remote_name = str(profile.get("remoteName", f"github-{args.profile}")).strip()
    commit_name = str(profile.get("commitName", account)).strip()
    commit_email = str(profile.get("commitEmail", default_commit_email(account))).strip()
    remote_url = profile_remote_url(account, repo)
    message = args.message or f"sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

    print("\n将使用以下配置：")
    print(f"  profile: {args.profile}")
    print(f"  account: {account}")
    print(f"  repo: {repo}")
    print(f"  branch: {branch}")
    print(f"  remote: {remote_name}")
    auth_env = None
    askpass_temp = None
    if args.auth == "token":
        token, login, user_id = get_or_create_token(args.profile, account, repo, args.reset_login)
        if login and login.lower() != account.lower():
            account = login
            remote_url = profile_remote_url(account, repo)
        auth_env, askpass_temp = make_askpass_env(account, token)
        if not str(profile.get("commitEmail", "")).strip() and user_id:
            commit_email = f"{user_id}+{login}@users.noreply.github.com"
        print(f"  token account: {account}")
        print("\n认证方式：本地 token。不会打开 GitHub 登录页。")
    else:
        print("\n认证方式：Git Credential Manager 浏览器登录。")
        if args.reset_login:
            reset_login(account, repo, args.dry_run)

    ensure_repo(args.init, args.dry_run)
    run(["git", "config", "credential.useHttpPath", "true"], dry_run=args.dry_run)
    run(["git", "config", "user.name", commit_name], dry_run=args.dry_run)
    run(["git", "config", "user.email", commit_email], dry_run=args.dry_run)
    run(["git", "checkout", "-B", branch], dry_run=args.dry_run)
    ensure_remote(remote_name, remote_url, args.dry_run, args.update_remote)

    if not args.no_pull:
        if remote_branch_exists(remote_name, branch, env=auth_env):
            run(["git", "pull", "--rebase", "--autostash", remote_name, branch], dry_run=args.dry_run, env=auth_env)
        else:
            print(f"远端分支 {remote_name}/{branch} 暂不存在，跳过 pull。")

    run(["git", "add", "-A"], dry_run=args.dry_run)
    if args.dry_run or has_staged_changes():
        run(["git", "commit", "-m", message], dry_run=args.dry_run)
    else:
        print("没有需要提交的本地变更。")

    push = run(["git", "push", "-u", remote_name, branch], check=False, dry_run=args.dry_run, env=auth_env)
    if push.returncode != 0:
        print("\n推送失败。常见原因：")
        print("1. 浏览器登录的 GitHub 账号不是当前 profile 的 account。")
        print("2. 当前账号没有目标仓库权限。")
        print("3. 旧凭据仍在 Windows Credential Manager 中。")
        print("\n可以在 Windows 凭据管理器中删除 github.com 相关凭据后重试。")
        fail("GitHub push failed.")

    if askpass_temp:
        askpass_temp.cleanup()

    if not args.dry_run:
        save_state(args.profile, profile, remote_url)

    print("\n同步完成。")
    print(f"本地配置文件：{CONFIG_PATH}")
    print(f"本地状态文件：{STATE_PATH}")
    print("这两个文件已加入 .gitignore，不会被上传到 GitHub。")


if __name__ == "__main__":
    main()
