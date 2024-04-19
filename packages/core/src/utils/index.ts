// 定义歌词行的类型
type LyricsLine = {
    time: number;
    duration: number;
    index: number;
    yrc: {
        text: string;
        transition: number;
        cursor: number;
    }[];
};

// 解析逐字歌词
export function parseYrc(yrc: string) {
    const result: LyricsLine[] = []
    let obj: LyricsLine = {
        time: 0,
        duration: 0,
        index: 0,
        yrc: [],
    }

    let startIndex = 0
    let endIndex = 0
    let present = '' // 当前扫描到的标识
    let index = 1 // 每行歌词的index
    let startCount = 0 // 当前扫描到的{数量
    let endCount = 0 // 当前扫描到的}数量
    let isEnd = true
    for (let i = 0; i < yrc.length; i++) {
        const target = yrc[i]
        if(target === '{') {
            if(isEnd) {
                startIndex = i
            }
            startCount++
            isEnd = false
            present = '{'

        } else if(target === '}') {
            endCount++
            if(startCount === endCount) {
                endIndex = i
                isEnd = true
                startCount = 0
                endCount = 0
            }

        } else if(target === '[' && isEnd) {

            startIndex = i
            present = '['
            obj = { time: 0, duration: 0, index: 0, yrc: [] }
            result.push(obj)

        } else if(target === ']' && isEnd) {

            endIndex = i
            const timeArr = yrc.slice(startIndex+1, endIndex).split(',')
            obj.time = +timeArr[0] / 1000
            obj.duration = +timeArr[1] / 1000
            obj.index = index++

        } else if(target === '(' && isEnd) {

            startIndex = i
            present = '('

        } else if(target === ')' && isEnd) {
            endIndex = i
            const timeArr = yrc.slice(startIndex+1, endIndex).split(',')
            let text: string = '';

            for (let o = i+1; o < yrc.length; o++) {
                if(['[', '('].includes(yrc[o])) {
                    break
                }
                text += yrc[o]
            }
            obj.yrc.push({
                text: text,
                transition: Number(timeArr[1]) / 1000,
                cursor: Number(timeArr[0]) / 1000,
            })
        }

    }
    return result
}

