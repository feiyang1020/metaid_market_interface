import level from "@/assets/level.svg";
import "./index.less";
export default ({ lvl }: { lvl: number | string }) => {
    return <div className="leel">
        {lvl && <img src={level} alt="" />}
        <span className="colorPrimary">{lvl || '--'}</span>
    </div>
}