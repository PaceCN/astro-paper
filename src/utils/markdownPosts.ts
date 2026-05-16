import { getCollection } from "astro:content";
import getSortedPosts from "@/utils/getSortedPosts";
import { getPath } from "@/utils/getPath";
import { SITE } from "@/config";

type Paginate = Parameters<import("astro").GetStaticPaths>[0]["paginate"];
type StaticPathsResult = Awaited<ReturnType<import("astro").GetStaticPaths>>;

export async function getMarkdownPostPages(
  paginate: Paginate
): Promise<StaticPathsResult> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return paginate(getSortedPosts(posts), { pageSize: SITE.postPerPage });
}

export async function getMarkdownPostPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: { post },
  }));
}

export async function getSortedMarkdownPosts() {
  const posts = await getCollection("blog");
  return getSortedPosts(posts);
}
