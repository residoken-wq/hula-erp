declare module 'react-quill' {
    import { Component } from 'react';

    export interface QuillOptions {
        theme?: string;
        modules?: object;
        formats?: string[];
        placeholder?: string;
        readOnly?: boolean;
        bounds?: string | HTMLElement;
        scrollingContainer?: string | HTMLElement;
    }

    export interface ReactQuillProps extends QuillOptions {
        value?: string;
        defaultValue?: string;
        onChange?: (content: string, delta: any, source: string, editor: any) => void;
        onChangeSelection?: (range: any, source: string, editor: any) => void;
        onFocus?: (range: any, source: string, editor: any) => void;
        onBlur?: (previousRange: any, source: string, editor: any) => void;
        onKeyPress?: React.KeyboardEventHandler<HTMLDivElement>;
        onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
        onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
        preserveWhitespace?: boolean;
        className?: string;
        style?: React.CSSProperties;
        tabIndex?: number;
        id?: string;
    }

    class ReactQuill extends Component<ReactQuillProps> {
        focus(): void;
        blur(): void;
        getEditor(): any;
    }

    export default ReactQuill;
}
