import React, { useEffect, useState } from "react";


import { Form, Input, Upload, Button, message, Avatar, UploadProps, theme, Typography } from "antd";
import { CameraOutlined, FileImageFilled, LoadingOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import userIcon from '@/assets/avatar.svg';
import Trans from "@/components/Trans";

const getBase64 = (img: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
};

const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
    }
    const isLt300k = file.size / 1024 / 1024 < 0.3;
    if (!isLt300k) {
        message.error("file must smaller than 300k!");
        return false;
    }
    return isJpgOrPng && isLt300k;
};

const UploadAvatar = (props: any) => {
    const { token: { colorText } } = theme.useToken()
    const [imageUrl, setImageUrl] = useState<string>(props.value);
    useEffect(() => {
        console.log(props.value)
        if (props.value && typeof props.value === 'string' && props.value.indexOf('http') === 0) {
            setImageUrl(props.value)
        } else {
            if (props.value === '') {
                setImageUrl('')
            }
        }
    }, [props.value])

    const handleChange: UploadProps['onChange'] = (info) => {
        if (info.file.status === 'uploading') {
            return;
        }
        if (info.file.status === 'done') {
            // Get this url from response in real world.
            getBase64(info.file.originFileObj as FileType, (url) => {
                setImageUrl(url);
                if (props.onChange) {
                    props.onChange(info.file.originFileObj);
                }
            });
        }
    };

    const handleUpload = async ({ file, onSuccess, onError }) => {
        onSuccess()
    }

    return (<div style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

        
            <Upload
                beforeUpload={beforeUpload}
                onChange={handleChange}
                name="avatar"
                listType={"picture-circle"}
                className="avatar-uploader"
                showUploadList={false}
                style={{ overflow: 'hidden', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                customRequest={handleUpload}
            >
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                    <img src={imageUrl || userIcon} alt="avatar" style={{ width: 100, height: 100, objectFit: 'cover', overflow: 'hidden', borderRadius: "50%" }} />
                    <Button style={{ position: 'absolute', bottom: 0, right: 0 }} size='small' shape='circle' type='primary' icon={<CameraOutlined />} >
                    </Button>

                    

                </div>
            </Upload>
        
    </div>
    );
};

export default UploadAvatar;
