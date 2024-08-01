import { Tooltip } from "antd"
import { useMemo } from "react"

export default ({ info, maxWidth = 200 }: { info: string, maxWidth?: number }) => {
    const message = useMemo(() => {
        try {
            return JSON.parse(info).message
        } catch (e) {
            return ''
        }
    }, [info])
    return <>
        {message}
    </>


}