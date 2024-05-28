import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import "react18-json-view/src/dark.css";
import "./index.less";
export default ({
  textContent,
  style={},
  collapseStringsAfterLength=99,
  collapsed=1
}: {
  collapsed?:number
  textContent: any;
  collapseStringsAfterLength?:number
  style?: React.CSSProperties;
}) => {
  return (
    <div className="textContent" style={{ background: "#1E1E1E",overflow:'hidden',boxSizing:'border-box' }}>
      <JsonView collapsed={collapsed} dark enableClipboard={false} src={textContent} collapseStringsAfterLength={collapseStringsAfterLength}  theme="a11y" style={{ ...style }} />
    </div>
  );
};
