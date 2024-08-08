import SortArrow from "../SortArrow";
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
}

export default ({ sorters, sortKey, sortType, setSortKey, setSortType }: Props) => {
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortType(sortType === 1 ? -1 : 1);
        } else {
            setSortKey(key);
            setSortType(-1);
        }
    };
    return <div className="sortWrap">
        {sorters.map((sorter, index) => {
            return <div
                className="sortItem"
                onClick={() => handleSort(sorter.key)}
            >
                {sorter.label}{" "}
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