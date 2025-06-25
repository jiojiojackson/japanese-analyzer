// 全局类型声明

// 添加ruby相关元素到JSX.IntrinsicElements
declare namespace JSX {
  interface IntrinsicElements {
    ruby: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    rt: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    rb: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    [elemName: string]: any;
  }
}

// 类型补充：第三方库无类型或版本冲突时临时声明
declare module 'react-markdown' {
  const ReactMarkdown: any;
  export default ReactMarkdown;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
}