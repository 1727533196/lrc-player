# @lrc-player/core  用于音乐播放器的歌词渲染

GitHub: [https://github.com/1727533196/lrc-player](https://github.com/1727533196/lrc-player)

生态作品: [https://gitee.com/wa-da-sheng-dao_0/vue3-electron-netease-cloud](https://gitee.com/wa-da-sheng-dao_0/vue3-electron-netease-cloud)

> 这个包为原生dom绑定，使用class来进行编写

## 安装
```
选择一个你当前项目中使用的包管理工具

npm: npm install @lrc-player/core@latest
yarn: yarn add @lrc-player/core@latest
pnpm: pnpm add @lrc-player/core@latest

在这里提供了一个帮助解析歌词的插件包
npm install @lrc-player/parse@latest
详细使用可以查看https://www.npmjs.com/package/@lrc-player/parse
```
## 初始化
```ts
import '@lrc-player/core/dist/style.css' // 引入样式
import { parseLrc, parseYrc } from '@lrc-player/parse'
import Player from '@lrc-player/core'

const player = new Player({
  // 当点击任意歌词行时，会触发这个事件
  click(time: number, index: number) {
    console.log(time, index)
    audio.value!.currentTime = time
    
    // 在歌词类内部不会主动追踪currentTime的改变行动
    //  所以任何主动更改currentTime的操作，都需要手动调用syncIndex来同步行
    player.syncIndex(index)
  }
})

// 挂载元素，确保这一步是最早且只需要挂载一次
//  第二个参数不一定必须是audio，只需要确认这个对象里包含 currentTime：number 属性即可（并且是实时更新的）
player.mount(document.querySelector('#app') as HTMLElement, audio)

// 更新url与歌词，通常在切换下一首或上一首时调用这个
// parseLrc是这个包里提供的解析歌词函数https://www.npmjs.com/package/@lrc-player/parse
const lrc = parseLrc('[11700,1410](11700,510,0)Let (12210,390,0)me (12600,510,0)know')
// 需要确认是逐字歌词还是逐行歌词，在这里是逐字，所以传入类型为lrc
player.updateAudioLrc(lrc, 'lrc')

// 开始播放音乐
audio.play()
// 开始同步歌词
player.play()

// 组件被销毁时，卸载Player实例
// react:
useEffect(() => {
  return () => {
    player.uninstall()
  }
}, [])

// vue:
onUnmounted(() => {
  player.uninstall()
})
```
   
## API

### function
* `player.play()` 开始播放
  * params：`无参数`
* `player.pause()` 暂停
  * params：`无参数`
* `player.updateAudioLrc(lrc, type: 'lrc' | 'yrc')` 更新歌词
  * `lrc` [`LyricsLine[]`](src/types/type.ts)：
* `player.syncIndex()` 同步歌词当前行，调用它可更改当前播放行
  * `index?: number` 若没有传入index，则会根据currentTime来自动同步当前行.(如果明确index，推荐传入以减少额外开销)
* `player.uninstall()` 卸载
