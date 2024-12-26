import { SelectLang, setLocale, useIntl } from 'umi';
import { Button, Popover, Tooltip, Typography, theme } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

export default () => {
  const intl = useIntl();
  const { token: { colorPrimary, colorText } } = theme.useToken()
  const currentLang = intl.locale === 'en-US' ? 'English' : '中文';
  return <Tooltip title='中文 / English' >
    <Button color='primary'  variant='filled' shape='circle' icon={<GlobalOutlined/>} onClick={() => { setLocale(currentLang === 'English' ? 'zh-CN' : 'en-US', false); }}>
      
    </Button>
  </Tooltip >;
};