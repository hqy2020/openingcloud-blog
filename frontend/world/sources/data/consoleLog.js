import * as THREE from 'three/webgpu'

const text = `
╔═ OpeningClouds 3D World ══════════╗
║ 欢迎来到 OpeningClouds 的 3D 云际世界。
║ 这个页面基于 folio-2025 的三维交互结构改造。
╚════════════════════════════════════╝

╔═ Links ════════════════════════════╗
║ Blog   ⇒ /
║ GitHub ⇒ https://github.com/hqy2020
║ Source ⇒ https://github.com/hqy2020/openingcloud-blog
╚════════════════════════════════════╝

╔═ Stack ════════════════════════════╗
║ Three.js release ⇒ ${THREE.REVISION}
║ Physics          ⇒ Rapier
║ Audio            ⇒ Howler.js
╚════════════════════════════════════╝
`

let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
