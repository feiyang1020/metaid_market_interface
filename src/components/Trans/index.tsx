import React from "react"
import { useIntl } from "umi"

export default ({ children }: { children: React.ReactNode }) => {
    const { formatMessage } = useIntl()
    if(!children) return null
    return <>
        {formatMessage({ id: children as string,defaultMessage: children as string })}
    </>
}