import {
  Button,
  Input,
  Space,
  Upload,
  UploadFile,
  UploadProps,
  message,
} from "antd";
import { useEffect, useState } from "react";
import "./index.less";
import { image2Attach } from "@/utils/utlis";
import { useModel } from "umi";
import { CreateOptions, IBtcConnector, IBtcEntity } from "@metaid/metaid";
import uploadIcon from "@/assets/upload.svg";
const items = ["File", "Buzz", "PINs"];
const { Dragger } = Upload;
const { TextArea } = Input;

export default () => {
  const [tab, setTab] = useState<"File" | "Buzz" | "PINs">("Buzz");
  const [submiting, setSubmiting] = useState(false);
  const [feeRate, setFeeRate] = useState<number>();
  const { btcConnector, connected, connect, feeRates } = useModel("wallet");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [buzz, setBuzz] = useState<string>("");
  useEffect(() => {
    const find = feeRates.find((item) => item.label === "Avg");
    if (find) {
      setFeeRate((prev) => {
        if (!prev) return find.value;
        return prev;
      });
    }
  }, [feeRates]);
  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBuzz(e.target.value);
  };
  const submit = async () => {
    if (!feeRate) return;
    try {
      setSubmiting(true);
      const images = fileList.length !== 0 ? await image2Attach(fileList) : [];

      const fileEntity = await btcConnector!.use("file");
      const fileOptions: CreateOptions[] = [];
      for (const image of images) {
        // console.log("image.data", Buffer.from(image.data, "hex").toString("base64"));
        fileOptions.push({
          body: Buffer.from(image.data, "hex").toString("base64"),
          contentType: "image/jpeg",
          encoding: "base64",
        });
      }
      const imageRes = await fileEntity.create({
        options: fileOptions,
        noBroadcast: "no",
        feeRate: feeRate,
      });
      message.success("inscribe success");
      setFileList([]);
    } catch (err) {
      message.error(err.message);
    }
    setSubmiting(false);
  };

  const submitBuzz = async () => {
    if (!buzz || !feeRate) return;
    setSubmiting(true);
    try {
      const buzzEntity = await btcConnector!.use("buzz");
      const createRes = await buzzEntity!.create({
        options: [{ body: JSON.stringify({ content: buzz }) }],
        noBroadcast: "no",
        feeRate: feeRate,
      });
      message.success("inscribe success");
      setBuzz("");
    } catch (err) {
      message.error(err.message);
    }
    setSubmiting(false);
  };

  const props: UploadProps = {
    name: "file",
    multiple: true,
    maxCount: 1,
    beforeUpload: (file) => {
      const isPNG = file.type === "image/png" || file.type === "image/jpeg";
      if (!isPNG) {
        message.error(`${file.name} is not a png or jpg file`);
        return false;
      }
      const isLt300k = file.size / 1024 / 1024 < 0.3;
      if (!isLt300k) {
        message.error("Image must smaller than 300k!");
        return false;
      }
      setFileList([...fileList, file]);
      return false;
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };
  return (
    <div className="inscribePage">
      <div className="title">Inscribe PINs</div>
      <div className="subTitle">Inscribe your PINs to Bitcoin</div>
      <div className="tabs">
        <Space>
          {items.map((item) => (
            <Button
              key={item}
              type={tab === item ? "link" : "text"}
              onClick={() => setTab(item)}
              size="large"
              disabled={item === "PINs"}
            >
              {item}
            </Button>
          ))}
        </Space>
      </div>
      {tab === "File" && (
        <div className="form">
          <div className="inputWrap">
            <div className="label">File Name</div>
            <Input
              className="input"
              placeholder=""
              variant="borderless"
            />
          </div>
          <div className="uploadWrap">
            <Dragger {...props}>
              <p className="ant-upload-text">Upload file</p>
              <p className="ant-upload-hint">Any file type. Max 300kb</p>
              <p className="ant-upload-drag-icon">
                <img src={uploadIcon} alt="" />
              </p>
            </Dragger>
          </div>
          {!connected ? (
            <Button block size="large" type="primary" onClick={connect}>
              Connect Wallet
            </Button>
          ) : (
            <Button
              block
              size="large"
              loading={submiting}
              type="primary"
              onClick={submit}
            >
              Submit
            </Button>
          )}
        </div>
      )}
      {tab === "Buzz" && (
        <div className="form2">
          <div className="textareaWrap">
            <div className="label">Buzz</div>
            <TextArea
              placeholder=""
              allowClear
              onChange={onChange}
              className="textarea"
              autoSize={false}
              style={{ height: 422 }}
              value={buzz}
            />
          </div>
          {!connected ? (
            <Button block size="large" type="primary" onClick={connect}>
              Connect Wallet
            </Button>
          ) : (
            <Button
              block
              size="large"
              loading={submiting}
              type="primary"
              onClick={submitBuzz}
            >
              Submit
            </Button>
          )}
          <div className="tips">
            You can view your buzz in{" "}
            <a href="https://www.bitbuzz.io/" target="_blank">
              bitbuzz.io
            </a>{" "}
            affer inscription
          </div>
        </div>
      )}
    </div>
  );
};
