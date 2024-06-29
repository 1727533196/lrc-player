# @lrc-player/core

> 这个包为原生dom绑定，使用class来进行编写，若没有使用到vue或react等框架时，建议使用他

## 初始化
```ts
const player = new Player()

// 挂载元素，确保这一步是最早且只需要挂载一次
player.mount(document.querySelector('#app') as HTMLElement, audio)

// 更新url与歌词，通常在切换下一首或上一首时调用这个
player.updateAudioUrl(data)
```
   
## API

### function
* `player.play()`
  * params：`无参数`
  * 开始播放
* `player.pause()` 
  * params：`无参数`
  * 暂停
* `player.updateAudioUrl(url, data)`
  * `url` `data`：
    * url：`string`
    * data：`object`
  * 更新源数据
* `player.setTime(options)`
  * `index?: number`
