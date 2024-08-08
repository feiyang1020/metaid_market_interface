import { useModel } from "umi"
import { Avatar } from "antd"
import { useMemo, useState } from "react"
type Props = {
    size?: number
    tick: string
    metadata?: string
}
export default ({ size = 40, tick, metadata = '' }: Props) => {
    const { network } = useModel('wallet')
    const [err, setErr] = useState(false)
    const src = useMemo(() => {
        if (metadata && !err) {
            try {
                const data = JSON.parse(metadata);
                if (data.icon) {
                    return data.icon.replace('metafile://', `https://man${network === 'testnet' ? '-test' : ''}.metaid.io/content/`)
                }
                if (data.cover) {
                    return data.cover.replace('metafile://', `https://man${network === 'testnet' ? '-test' : ''}.metaid.io/content/`)
                }

            } catch (err) {
                return ''
            }
        }
        return ''
    }, [metadata, err])
    return <Avatar src={src ? <img src={src} onError={() => { setErr(true) }}></img> : null} style={{ background: 'var(--primary)', color: '#000', fontWeight: 'bold', fontSize: size * 16 / 40, minWidth: size }} size={size}>{tick && tick[0].toUpperCase()}</Avatar>
}