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
    <div className="jsonContent" style={{ background: "#1E1E1E",boxSizing:'border-box' }}>
      <div className="scroll-container">
        <div className="scroll-content">
        <JsonView collapsed={collapsed} dark enableClipboard={false} src={textContent} collapseStringsAfterLength={collapseStringsAfterLength}  theme="a11y" style={{ ...style }} />
        </div>
      </div>
      
    </div>
  );
};
