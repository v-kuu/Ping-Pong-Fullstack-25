import site from '../babylon/index.html?url'

export function Babylon(): JSX.Element {
  return (
    <iframe
      title="BabylonJS Playground"
      src={site}
      width="100%"
      height="800px"
      style={{ border: 0 }}
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  )
}
