# @lrc-player/core

> 这个包为原生dom绑定，使用class来进行编写，若没有使用到vue或react等框架时，建议使用他

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
  * `index?: number`
* `uninstall` 卸载
