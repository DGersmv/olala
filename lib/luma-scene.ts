/** Local path under public/luma/ — see scripts/download-luma-scene.mjs */
export const OLALA_LUMA_SCENE_SLUG = "olala-inbox"

export const OLALA_LUMA_SCENE_SRC = `/luma/${OLALA_LUMA_SCENE_SLUG}`

/** Only list files we self-host — avoids 404 on optional gs_web_meta / semantics */
export const OLALA_LUMA_ARTIFACTS = {
  gs_compressed: `${OLALA_LUMA_SCENE_SRC}/gs_compressed.bin`,
  gs_compressed_meta: `${OLALA_LUMA_SCENE_SRC}/gs_compressed_meta.json`,
  with_background_gs_camera_params: `${OLALA_LUMA_SCENE_SRC}/with_background_gs_camera_params.json`,
  skybox: `${OLALA_LUMA_SCENE_SRC}/skybox.jpg`,
  skybox_meta: `${OLALA_LUMA_SCENE_SRC}/skybox_meta.json`,
} as const

/** Original capture (for re-download script reference) */
export const OLALA_LUMA_CAPTURE_ID = "918250fc-a1ea-4d1a-979b-b241517d4bd2"

export const OLALA_LUMA_CAPTURE_URL =
  `https://lumalabs.ai/capture/${OLALA_LUMA_CAPTURE_ID}`
