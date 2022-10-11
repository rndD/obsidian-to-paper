import { readFile } from 'fs/promises'
import * as path from 'path'

const API_URLS = {
  paper_create: 'https://api.dropboxapi.com/2/files/paper/create',
  share_link:
    'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
  list_shared_links: 'https://api.dropboxapi.com/2/sharing/list_shared_links',
}

export const uploadToPaper = async (
  filepath: string,
  apiKey: string,
  paperPrefix: string,
) => {
  const basename = path.basename(filepath)
  const file = await readFile(filepath)
  const paperPath = path.join('/', paperPrefix, basename + '.paper')

  const response = await fetch(API_URLS.paper_create, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: paperPath,
        import_format: 'markdown',
      }),
    },
    body: file,
  })
  // TODO read body and check for errors in status
  const json = await response.json()

  if (json.error) {
    throw new Error(json.error_summary)
  }
  const resultPath = json.result_path

  const response2 = await fetch(API_URLS.list_shared_links, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: resultPath,
      direct_only: true,
    }),
  })
  const json2 = await response2.json()
  if (json2.error) {
    throw new Error(json2.error_summary)
  }
  const links = json2.links
  return links[0].url

  //   const response2 = await fetch(API_URLS.share_link, {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${apiKey}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       path: resultPath,
  //       settings: {
  //         access: 'viewer',
  //         allow_download: true,
  //         audience: 'public',
  //         requested_visibility: 'public',
  //       },
  //     }),
  //   })
  //   // TODO read body and check for errors in status
  //   const json2 = await response2.json()

  //   if (json2.error) {
  //     throw new Error(json.error_summary)
  //   }

  //   return json2.url
}
