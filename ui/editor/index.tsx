'use client';

import '../../styles/editor.css';
import CharacterCount from '@tiptap/extension-character-count';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Document from '@tiptap/extension-document';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import React from 'react';
import TextAlign from '@tiptap/extension-text-align';
import {
  BubbleMenu, EditorContent, FloatingMenu, InputRule, JSONContent, useEditor
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import classNames from 'classnames';
import { useEffect, useRef, useState
} from 'react';
import { BiText } from 'react-icons/bi';
import {
  BsImage, BsLink45Deg, BsListOl,
  BsListUl, BsPlus, BsTypeBold, BsTypeItalic
} from 'react-icons/bs';
import { PiBracketsCurly } from 'react-icons/pi';
import { MdOutlineHorizontalRule } from 'react-icons/md';

import UpdatedImage from '@/ui/editor/extensions/updated-image';
import { ConvertBase64 } from '@/utils/convert-base64';
import { useOutsideClick } from '@/lib/hooks/use-outside-click';

import Button from './components/Button';
import ImageResize from './extensions/image-resizer';
import InlineSelector from './extensions/inline-selector';
import EnterAfterImage from './extensions/enter-after-image';

const contentLimit = 5000;

const contentDocument = Document.extend({
  content: 'block+'
});

function Editor() {
  const [content, setContent] = useState<JSONContent>([]);
  const [plainContent, setPlainContent] = useState('');
  const [editedContent, setEditedContent] = useState<JSONContent>([]);
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [showFloatMenu, setShowFloatMenu] = useState(false);
  const [showPlusButton, setShowPlusButton] = useState(true);

  const hiddenFileInput = useRef() as React.MutableRefObject<HTMLInputElement>;

  // const debouncedContentJSON = useDebouncedCallback((_content) => {
  //   setContent(_content);
  // }, 300);

  const shouldFloatingMenuShow = (editor: any) => {
    console.log('shouldFloatingMenuShow', editor);
    console.log('editor.state', editor.state);
    const { selection } = editor.state;
    
    // if current pointer is inside the code block, do not show the floating menu.
    if (selection.$head.parent.type.name === 'codeBlock') {
      return false;
    }
    // If the selection is not empty, do not show the floating menu.
    // If depth is 1, it means the selection is in the top level of the document.
    // ol, ul depth will not be 1, so we need to check if the selection is in the top level.
    if (!selection.empty || selection.$head.parent.content.size > 0 || selection.$head.depth !== 1) {
      return false;
    }

    return true;
  };

  const alertUser = (e: any) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    window.addEventListener('beforeunload', alertUser);

    return () => {
      window.removeEventListener('beforeunload', alertUser);
    };
  }, []);
  
  const editor = useEditor({
    onUpdate({ editor }) {
      setPlainContent(editor.getText());
      setContent(editor.getJSON());
    // debouncedContentJSON(editor.getJSON());
    },
    onFocus() {
      setShowFloatMenu(false);
    },
    onBlur() {
      setShowFloatMenu(false);
    },
    onSelectionUpdate({ editor }) {
      setShowBubbleMenu(true);
      setShowPlusButton(true);

      if (editor.isActive('image') || editor.isActive('horizontalRule')) {
        setShowBubbleMenu(false);
        setShowPlusButton(false);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose-lg prose-prime prose-headings:font-display font-default focus:outline-none max-w-full'
      }
    },
    // only bullet list and ordered list
    enableInputRules: [
      'bulletList',
      'orderedList',
      'blockquote',
      'heading',
      'horizontalRule'
    ],
    enablePasteRules: false,
    extensions: [
      StarterKit.configure({
        // config heading
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal'
          } 
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-normal -mb-2'
          }
        },
        document: false
      }),
      contentDocument,
      HorizontalRule.extend({
        addInputRules() {
          return [
            new InputRule({
              find: /^(?:---|—-|___\s|\*\*\*\s)$/,
              handler: ({ state, range }) => {
                const attributes = {};
    
                const { tr } = state;
                const start = range.from;
                const end = range.to;
    
                tr.insert(start - 1, this.type.create(attributes)).delete(
                  tr.mapping.map(start),
                  tr.mapping.map(end),
                );
              }
            })
          ];
        }
      }).configure({
        HTMLAttributes: {
          class: 'mt-4 mb-6 border-t border-stone-300'
        }
      }),
      Placeholder.configure({
        placeholder: 'Tell your story...'
      }),
      Image.configure({
        allowBase64: true
      }),
      Link.configure({
        openOnClick: true
      }),
      CharacterCount.configure({
        limit: contentLimit
      }),
      TextAlign.configure({
        types: ['image']
      }),
      UpdatedImage.configure({
        inline: true
      }),
      EnterAfterImage
    ]
  });

  useEffect(() => {
    editor?.commands.setContent(editedContent);
    setPlainContent(editor?.getText() || '');
  }, [editedContent]);

  const handleClickOutside = () => {
    setShowFloatMenu(false);
  };

  const ref = useOutsideClick(handleClickOutside);

  //   const setLink = useCallback(async () => {
  //     const previousUrl = editor?.getAttributes('link').href;

  //     let url = null;
  //     await Swal.fire({
  //       input: 'url',
  //       inputValue: previousUrl,
  //       inputLabel: '輸入網址',
  //       inputPlaceholder: previousUrl || 'e.g. https://example.com',
  //       showCancelButton: true,
  //       validationMessage: '請輸入正確的網址',
  //       confirmButtonColor: '#1919E8',
  //       confirmButtonText: '確定',
  //       cancelButtonText: '取消',
  //     }).then((result: any) => {
  //       if (result.isConfirmed) {
  //         url = result.value;
  //       }
  //     });

  //     // cancelled
  //     if (url === null) {
  //       return;
  //     }

  //     // empty
  //     if (url === '') {
  //       editor?.chain().focus().extendMarkRange('link').unsetLink()
  //         .run();

  //       return;
  //     }

  //     // update link
  //     editor?.chain().focus().extendMarkRange('link').setLink({
  //       href: url,
  //     })
  //       .run();
  //   }, [editor]);

  const handleClick = () => {
    hiddenFileInput?.current.click();
  };

  const addImage = async (e: any) => {
    const file = e.target.files[0];
    // const url = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/440px-Image_created_with_a_mobile_phone.png";
    const base64 = await ConvertBase64(file);

    if (base64) {
      editor?.chain().focus().setImage({
        src: base64
      }).run();
    }

    // console.log(editor.getHTML());
    // const { value: file } = await Swal.fire({
    //     title: "Select image",
    //     input: "file",
    //     inputAttributes: {
    //         accept: "image/*",
    //         "aria-label": "Upload your profile picture",
    //     },
    // });

    // if (file) {
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //         editor.chain().focus().setImage({ src: e.target.result }).run();
    //     };
    //     reader.readAsDataURL(file);
    // }
  };

  if (editor == null) return null;

  return (
    <div className='relative min-h-[500px] mx-auto w-full max-w-screen-lg border-stone-200 bg-white p-12 px-8 sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:px-12 sm:shadow-lg'>
      <BubbleMenu
        className={classNames(
          showBubbleMenu ? 'flex' : 'hidden',
          'border rounded-2xl w-48 h-8 justify-around px-2 bg-gray-600',
        )}
        editor={editor}
        tippyOptions={{
          duration: 100
        }}
      >
        <>
          <button
            className={editor.isActive('bold') ? 'text-prime-400' : 'text-white'}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BsTypeBold className="h-6 w-6" />
          </button>
          <button
            className={editor.isActive('italic') ? 'text-prime-400' : 'text-white'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <BsTypeItalic className="h-6 w-6" />
          </button>
          <button
            className={editor.isActive('link') ? 'text-prime-400' : 'text-white'}
            // onClick={setLink}
          >
            <BsLink45Deg className="h-6 w-6" />
          </button>
          {/* <div className="mt-[7px] h-1/2 border border-gray-400" /> */}
          <button
            className={editor.isActive('heading', { level: 2  }) ? 'text-prime-400' : 'text-white'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <BiText className="h-6 w-6" />
          </button>
          <button
            className={editor.isActive('heading', { level: 3 })
              ? 'text-prime-400'
              : 'text-white'}
            onClick={() => editor.chain().focus().toggleHeading({
              level: 3
            }).run()}
          >
            <BiText className="h-5 w-5" />
          </button>
        </>
      </BubbleMenu>

      <FloatingMenu
        className={classNames(showPlusButton ? 'flex' : 'hidden', 'relative')}
        editor={editor}
        // don't show if current node is h1 or if current node is not empty
        shouldShow={() => shouldFloatingMenuShow(editor)}
        tippyOptions={{
          duration: 100
        }}
      >
        <button
          ref={ref}
          className={classNames(
            'absolute right-5 top-[-14px] rounded-full border border-prime-400 p-1 text-prime-400 transition-transform duration-300',
            { 'rotate-45': showFloatMenu }
          )}
          onClick={() => { 
            setShowFloatMenu(!showFloatMenu); 
          }}
        >
          <BsPlus className="text-prime-400" size={20} />
        </button>

        {showFloatMenu && (
          <div className='absolute -left-3 -top-5 flex h-10 w-48 items-center space-x-3 bg-white'>
            <Button
              onClick={handleClick}
            >
              <BsImage className="text-prime-400" size={20} />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
              <PiBracketsCurly className="text-prime-400" size={20} />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <BsListUl className="text-prime-400" size={20} />
            </Button>
            <Button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <BsListOl className=" text-prime-400" size={20} />
            </Button>
            <Button
              onClick={() => {
                editor.chain().focus().setHorizontalRule().run();
              }}
            >
              <MdOutlineHorizontalRule className="text-prime-400" size={20} />
            </Button>
          </div>
        )}
      </FloatingMenu>
      <input
        ref={hiddenFileInput}
        hidden
        accept="image/*"
        type="file"
        onInput={(e) => {
          addImage(e);
        }}
      />
      <InlineSelector editor={editor} />
      {editor?.isActive('image') && <ImageResize editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

export default Editor;
