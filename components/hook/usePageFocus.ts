import {useEffect} from 'react';

function usePageFocus(callback: () => void) {
    useEffect(() => {
        // 页面获得焦点时调用的函数
        const handleFocus = () => {
            callback();
        };

        // 绑定事件监听器
        window.addEventListener('focus', handleFocus);

        // 清理函数
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [callback]); // 依赖项中包含了传入的回调函数
}

export default usePageFocus;