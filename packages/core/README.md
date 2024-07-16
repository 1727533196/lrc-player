# @lrc-player/core  用于音乐播放器的歌词渲染

GitHub: [https://github.com/1727533196/lrc-player](https://github.com/1727533196/lrc-player)

生态作品: [https://gitee.com/wa-da-sheng-dao_0/vue3-electron-netease-cloud](https://gitee.com/wa-da-sheng-dao_0/vue3-electron-netease-cloud)

> 这个包为原生dom绑定，使用class来进行编写

## 初始化
```ts
const player = new Player()

// 挂载元素，确保这一步是最早且只需要挂载一次
player.mount(document.querySelector('#app') as HTMLElement, audio)

// 更新url与歌词，通常在切换下一首或上一首时调用这个
player.updateAudioLrc(lrc)
```
   
## API

### function
* `player.play()` 开始播放
  * params：`无参数`
* `player.pause()` 暂停
  * params：`无参数`
* `player.updateAudioLrc(lrc)` 更新歌词
  * `lrc` [`LyricsLine[]`](src/types/type.ts)：
* `player.syncIndex()` 同步歌词当前行，调用它可更改当前播放行
  * `index?: number` 若没有传入index，则会根据currentTime来自动同步当前行
* `uninstall` 卸载
