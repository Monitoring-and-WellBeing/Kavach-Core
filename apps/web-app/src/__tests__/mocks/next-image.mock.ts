// Mock for next/image
import React from 'react'

const NextImage = (props: any) => {
  const { src, alt, ...rest } = props
  // eslint-disable-next-line @next/next/no-img-element
  return React.createElement('img', { src, alt, ...rest })
}

export default NextImage
