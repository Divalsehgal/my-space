/**
 * GraphQL queries shared by the server fetchers and the client-side live
 * preview. Kept out of `lib/services/contentful` (server-only) so the preview
 * page can hand the same query to `useContentfulLiveUpdates`.
 *
 * `__typename` and `sys.id` on every entry/asset are required by Contentful's
 * live-updates SDK to match incoming draft edits to the right object.
 */
export const BLOG_POST_BY_SLUG_QUERY = `query GetBlogPostBySlug($slug: String!, $preview: Boolean = false) {
  blogPageCollection(where: {slug: $slug}, limit: 1, preview: $preview) {
    items {
      __typename
      sys {
        id
        firstPublishedAt
        publishedAt
      }
      title
      slug
      body {
        json
        links {
          assets {
            block {
              __typename
              sys {
                id
              }
              url
              title
              width
              height
            }
          }
        }
      }
      quiz {
        __typename
        sys { id }
        title
        questionEntriesCollection(limit: 50) {
          items {
            __typename
            sys { id }
            questionText { json }
            explanation { json }
            correctAnswer { __typename sys { id } }
            optionsCollection(limit: 4) {
              items { __typename sys { id } text { json } }
            }
          }
        }
      }
    }
  }
}`;
