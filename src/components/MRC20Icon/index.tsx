import { Avatar } from "antd"
type Props = {
    size?: number
    tick: string
}
export default ({ size = 40, tick }: Props) => {
    return <Avatar style={{ background: 'var(--primary)', color: '#000', fontWeight: 'bold',fontSize:size*16/40 }} size={size}>{tick && tick[0].toUpperCase()}</Avatar>
}