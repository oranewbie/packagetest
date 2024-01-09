import React from "react";
import {
  ToggleButtonGroup,
  Stack,
  ToggleButton,
  ToggleButtonProps,
  Tooltip
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { forwardRef, useCallback } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import CodeIcon from "@mui/icons-material/Code";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import WrapTextIcon from "@mui/icons-material/WrapText";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FormatTextdirectionLToROutlinedIcon from '@mui/icons-material/FormatTextdirectionLToROutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';

import { Editor } from "@tiptap/react";

const StyledButton = styled(ToggleButton)(({ theme }) => ({
  boxShadow: "none",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: theme.palette.divider,
  "--ToggleButton-radius": "none"
})) ;

const ToolbarButton = forwardRef(
  (props, ref) => <StyledButton ref={ref} {...props} size="small" />
);

const MenuBar = ({ editor }) => {
  const setUnsetLink = useCallback(() => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("URL");

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("image").clearContent().run();
      return;
    }

    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addYoutubeVideo = useCallback(() => {
    const url = prompt("Enter YouTube URL");

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("youtube").clearContent().run();
      return;
    }

    editor.commands.setYoutubeVideo({
      src: url,
      width: 320,
      height: 180
    });
  }, [editor]);

  return (
    <Stack direction="row" spacing={1}>
      <ToggleButtonGroup aria-label="Text formatting">
        <Tooltip title="Bold">
          <ToolbarButton
            value="bold"
            aria-label="Toggle Bold selection"
            onClick={() => editor.chain().focus().toggleBold().run()}
            selected={editor.isActive("bold")}>
            <FormatBoldIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Italic">
          <ToolbarButton
            value="italic"
            aria-label="Toggle Italic selection"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            selected={editor.isActive("italic")}>
            <FormatItalicIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Underline">
          <ToolbarButton
            value="underline"
            aria-label="Toggle Italic selection"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            selected={editor.isActive("underline")}>
            <FormatUnderlinedIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Strike">
          <ToolbarButton
            value="strike"
            aria-label="Toggle Strike through selection"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            selected={editor.isActive("strike")}>
            <FormatStrikethroughIcon />
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
        <Tooltip title="Code">
          <ToolbarButton
            value="code"
            aria-label="Toggle Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            selected={editor.isActive("code")}>
            <CodeIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <ToolbarButton
            value="codeBlock"
            aria-label="Toggle Code block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            selected={editor.isActive("codeBlock")}>
            CB
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Clear all format">
          <ToolbarButton
            value="unsetAllMarks"
            aria-label="Clear all formats of selections"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}>
            <FormatClearIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Link">
          <ToolbarButton
            value="link"
            aria-label="Add Link"
            onClick={setUnsetLink}>
            {editor.isActive("link") ? <LinkOffIcon /> : <InsertLinkIcon />}
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip title="Table">
          <ToolbarButton
            value="Table"
            aria-label="Insert an Table"
            onClick={()=>editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <GridOnOutlinedIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Image">
          <ToolbarButton
            value="image"
            aria-label="Insert an image"
            onClick={addImage}>
            <AddPhotoAlternateIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Youtube">
          <ToolbarButton
            value="youtube"
            aria-label="Insert a Youtube video"
            onClick={addYoutubeVideo}>
            <YouTubeIcon />
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
      
      <Tooltip title="Paragraph">
          <ToolbarButton
            value="Paragraph"
            aria-label="Paragraph"
            onClick={() =>
              editor.chain().focus().setParagraph().run()
            }
            selected={editor.isActive("paragraph")}>
            <FormatTextdirectionLToROutlinedIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="H1">
          <ToolbarButton
            value="heading1"
            aria-label="Toggle Heading 1 selection"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            selected={editor.isActive("heading", { level: 1 })}>
            h1
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="H2">
          <ToolbarButton
            value="heading2"
            aria-label="Toggle Heading 2 selection"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            selected={editor.isActive("heading", { level: 2 })}>
            h2
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="H3">
          <ToolbarButton
            value="toggleHeading-3"
            aria-label="Toggle Heading 3 selection"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            selected={editor.isActive("heading", { level: 3 })}>
            h3
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="H4">
          <ToolbarButton
            value="toggleHeading-4"
            aria-label="Toggle Heading 4 selection"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            selected={editor.isActive("heading", { level: 4 })}>
            h4
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="H5">
          <ToolbarButton
            value="toggleHeading-5"
            aria-label="Toggle Heading 5 selection"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 5 }).run()
            }
            selected={editor.isActive("heading", { level: 5 })}>
            h5
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="H6">
          <ToolbarButton
            value="toggleHeading-6"
            aria-label="Toggle Heading 6 selection"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 6 }).run()
            }
            selected={editor.isActive("heading", { level: 6 })}>
            h6
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
        <Tooltip title="BulletList">
          <ToolbarButton
            value="toggleBulletList"
            aria-label="Toggle Bullet List selection"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            selected={editor.isActive("bulletList")}>
            <FormatListBulletedIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="OrderedList">
          <ToolbarButton
            value="toggleOrderedList"
            aria-label="Toggle Ordered List selection"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            selected={editor.isActive("orderedList")}>
            <FormatListNumberedIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Blockquote">
          <ToolbarButton
            value="toggleBlockquote"
            aria-label="Toggle Blockquote selection"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            selected={editor.isActive("blockquote")}>
            <FormatQuoteIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="HardBreak">
          <ToolbarButton
            value="setHardBreak"
            aria-label="Set hard break to current line"
            onClick={() => editor.chain().focus().setHardBreak().run()}>
            <WrapTextIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="HorizontalRule">
          <ToolbarButton
            value="setHorizontalRule"
            aria-label="Add Horizontal Rule to current line"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <HorizontalRuleIcon />
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>

      <ToggleButtonGroup>
        <Tooltip title="Align Left">
          <ToolbarButton
            value="setTextAlign-left"
            aria-label="Set text align left"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            selected={editor.isActive("left")}>
            <FormatAlignLeftIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <ToolbarButton
            value="setTextAlign-center"
            aria-label="Set text align right"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            selected={editor.isActive("center")}>
            <FormatAlignCenterIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <ToolbarButton
            value="setTextAlign-right"
            aria-label="Set text align right"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            selected={editor.isActive("right")}>
            <FormatAlignRightIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Align Justify">
          <ToolbarButton
            value="setTextAlign-justify"
            aria-label="Set text align right"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            selected={editor.isActive("justify")}>
            <FormatAlignJustifyIcon />
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
        <Tooltip title="Undo">
          <ToolbarButton
            value="Undo"
            aria-label="Undo"
            onClick={() =>
              editor.chain().focus().undo().run()
            }
            disabled={
              !editor.can()
                .chain()
                .focus()
                .undo()
                .run()
            }>
            <UndoOutlinedIcon />
          </ToolbarButton>
        </Tooltip>
        <Tooltip title="Redo">
          <ToolbarButton
            value="Redo"
            aria-label="Redo"
            onClick={() =>
              editor.chain().focus().redo().run()
            }
            disabled={
              !editor.can()
                .chain()
                .focus()
                .redo()
                .run()
            }>
            <RedoOutlinedIcon />
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>
      <ToggleButtonGroup>
      <Tooltip title="Component">
          <ToolbarButton
            value="Component"
            aria-label="Component"
            onClick={() =>
              editor.chain().focus().setReactComponent().run()
            }>
            Component
          </ToolbarButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default MenuBar;
