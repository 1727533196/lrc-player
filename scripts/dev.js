// 引入 Node.js 的 child_process 模块，我们将使用它来执行 shell 命令
import { spawn } from 'child_process';

// 从命令行参数中获取项目名称，如果没有提供参数，那么默认值会是 'core'
const project = process.argv[2] || 'core';

// 使用 spawn 函数执行 'npm run dev' 命令
// 第一个参数是要执行的命令，第二个参数是命令的参数列表
// 第三个参数是选项，我们设置 cwd 为 `packages/${project}`，这意味着命令将在 `packages/${project}` 目录下执行
// 我们还设置了 shell 为 true，这意味着命令将在 shell 中执行，这样我们就可以使用 shell 的特性，如通配符和管道
// stdio: 'inherit' 会将子进程的 stdio 流（包括 stdout、stderr 和 stdin）连接到主进程
// 这意味着子进程的输出将会直接显示在终端中，就像你直接运行 'npm run dev' 命令一样
const child = spawn('npm', ['run', 'dev'], {
    cwd: `packages/${project}`,
    shell: true,
    stdio: 'inherit'
});

// 监听 error 事件，当子进程无法被启动，或者无法被控制时，这个事件会被触发
// 我们将错误信息打印到控制台
child.on('error', (error) => {
    console.error(`error: ${error.message}`);
});

// 监听 close 事件，当子进程退出时，这个事件会被触发
// 我们打印子进程的退出码
child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
