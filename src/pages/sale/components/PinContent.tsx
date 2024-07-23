import JSONView from "@/components/JSONView";
import { getContent } from "@/services/api";
import { Skeleton } from "antd";
import { useCallback, useEffect, useState } from "react";

export default ({ asset }: { asset: API.Asset }) => {
    const [item, setItem] = useState<API.Asset>(asset)
    const [loading, setLoading] = useState<boolean>(true);
    const fetchPinContent = useCallback(async () => {
        const _item = asset
        if (asset && asset.info.contentTypeDetect.indexOf("text") > -1 && asset.textContent === undefined) {
            const cont = await getContent(asset.content);
            _item.textContent = cont;
        }
        setItem(_item)
        setLoading(false)
    }, [asset])

    useEffect(() => {
        fetchPinContent()
    }, [fetchPinContent])
    return <>
        {item.info &&
            item.info.contentTypeDetect.indexOf("image") > -1 && (
                <img className="imageCont" src={item.content}></img>
            )}
        {
            loading && !item.textContent && <Skeleton active />
        }
        {item.textContent && (
            <JSONView textContent={item.textContent} />
        )}
    </>
}