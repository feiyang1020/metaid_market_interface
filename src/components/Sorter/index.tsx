import SortArrow from "../SortArrow";
import Trans from "../Trans";
import "./index.less";

type Props = {
    sorters: {
        label: string,
        key: string,
    }[]
    sortKey?: string
    sortType?: 1 | -1,
    setSortKey: (key: string) => void,
    setSortType: (type: 1 | -1) => void,
    className?: string
}

export default ({ sorters, sortKey, sortType, setSortKey, setSortType, className = '' }: Props) => {
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortType(sortType === 1 ? -1 : 1);
        } else {
            setSortKey(key);
            setSortType(-1);
        }
    };
    return <div className={`sortWrap ${className}`} >
        {sorters.map((sorter, index) => {
            return <div
                className="sortItem"
                onClick={() => handleSort(sorter.key)}
            >
                <Trans>{sorter.label}</Trans>{" "}
                <SortArrow
                    status={
                        sortKey === sorter.key
                            ? sortType === 1
                                ? "up"
                                : "down"
                            : undefined
                    }
                ></SortArrow>
            </div>
        })}
    </div>
}