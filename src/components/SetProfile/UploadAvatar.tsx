import React, { useState } from "react";


import { Form, Input, Upload, Button, message, Avatar, UploadProps } from "antd";
import { LoadingOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";

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

    const [imageUrl, setImageUrl] = useState<string>();
    const [loading, setLoading] = useState(false);

    const handleChange: UploadProps['onChange'] = (info) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }
        if (info.file.status === 'done') {
            // Get this url from response in real world.
            getBase64(info.file.originFileObj as FileType, (url) => {
                setLoading(false);
                setImageUrl(url);
                if (props.onChange) {
                    props.onChange(info.file.originFileObj);
                }
            });
        }
    };

    const uploadButton = (
        <button style={{ border: 0, background: 'none', color: '#fff' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    return (
        <Upload
            beforeUpload={beforeUpload}
            onChange={handleChange}
            name="avatar"
            listType="picture-circle"
            className="avatar-uploader"
            showUploadList={false}
            style={{ overflow: 'hidden' }}
        >
            {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', overflow: 'hidden' }} /> : uploadButton}
        </Upload>
    );
};

export default UploadAvatar;
