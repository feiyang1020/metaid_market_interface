import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Upload,
  UploadFile,
  UploadProps,
  message,
} from "antd";
import { useEffect, useState } from "react";
import "./index.less";
import { FileToAttachmentItem, image2Attach } from "@/utils/utlis";
import { useModel } from "umi";
import { CreateOptions, IBtcConnector, IBtcEntity } from "@metaid/metaid";
import uploadIcon from "@/assets/upload.svg";
import { getCreatePinFeeByNet } from "@/config";
const items = ["File", "Buzz", "PINs"];
const { Dragger } = Upload;
const { TextArea } = Input;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};

type FeeRateProps = {
  feeRate: number | undefined;
  setFeeRate: (feeRate: number) => void;
};

const SeleceFeeRate = ({ feeRate, setFeeRate }: FeeRateProps) => {
  const { feeRates, network } = useModel("wallet");
  const [customRate, setCustomRate] = useState<string | number>();
  return (
    <div className="FeeRateWrap">
      <Row gutter={[24, 24]}>
        {feeRates.map((item) => (
          <Col span={8} onClick={() => setFeeRate(item.value)} key={item.label}>
            <div
              className={`feeRateItem ${
                item.value === feeRate ? "active" : ""
              }`}
            >
              <div className="Feelabel">{item.label}</div>
              <div className="Feevalue">{item.value} sat/vB</div>
              <div className="Feetime">{item.time}</div>
            </div>
          </Col>
        ))}
      </Row>
      <Row
        className={`custom ${customRate === feeRate ? "active" : ""}`}
        onClick={() => {
          customRate && setFeeRate(Number(customRate));
        }}
      >
        <Col span={24} style={{ textAlign: "left" }}>
          Customize fee rate
        </Col>
        <Col span={24}>
          {" "}
          <InputNumber
            value={customRate}
            onChange={setCustomRate}
            style={{ width: "100%" }}
            variant="borderless"
            suffix="sat/vB"
            controls={false}
          />
        </Col>
      </Row>
    </div>
  );
};
export default () => {
  const [tab, setTab] = useState<"File" | "Buzz" | "PINs">("PINs");
  const [submiting, setSubmiting] = useState(false);
  const [feeRate, setFeeRate] = useState<number>();
  const { btcConnector, connected, connect, feeRates, network } =
    useModel("wallet");
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
    if (!feeRate || fileList.length === 0) return;
    try {
      setSubmiting(true);
      console.log(fileList, "fileList");
      const file = fileList[0];
      const fileEntity = await btcConnector!.use("file");
      const fileOptions: CreateOptions[] = [];
      const isPNG = file.type?.includes("image");

      if (isPNG) {
        const images = await image2Attach([file]);
        for (const image of images) {
          console.log(image, "image");
          fileOptions.push({
            body: Buffer.from(image.data, "hex").toString("base64"),
            contentType: image.fileType,
            encoding: "base64",
            flag: network === "mainnet" ? "metaid" : "testid",
          });
        }
      } else {
        const result = await FileToAttachmentItem(file);
        fileOptions.push({
          body: Buffer.from(result.data, "hex").toString("base64"),
          contentType: result.fileType,
          encoding: "base64",
          flag: network === "mainnet" ? "metaid" : "testid",
        });
      }

      const imageRes = await fileEntity.create({
        options: fileOptions,
        noBroadcast: "no",
        feeRate: feeRate,
        service: getCreatePinFeeByNet(network),
      });
      console.log(imageRes);
      message.success("inscribe success");
      setFileList([]);
    } catch (err) {
      console.log(err);
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
        options: [
          {
            body: JSON.stringify({ content: buzz }),
            contentType: "text/plain",
            flag: network === "mainnet" ? "metaid" : "testid",
          },
        ],
        noBroadcast: "no",
        feeRate: feeRate,
        service: getCreatePinFeeByNet(network),
      });
      console.log(createRes);
      message.success("inscribe success");
      setBuzz("");
    } catch (err) {
      message.error(err.message);
    }
    setSubmiting(false);
  };

  const props: UploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    beforeUpload: (file) => {
      // const isPNG =
      //   file.type === "image/png" ||
      //   file.type === "image/jpeg" ||
      //   file.type === "image/gif";
      // if (!isPNG) {
      //   message.error(`${file.name} is not image file`);
      //   return false;
      // }
      console.log(file);
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
    <div className="inscribePage animation-slide-bottom">
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
            >
              {item}
            </Button>
          ))}
        </Space>
      </div>
      {tab === "File" && (
        <div className="form animation-slide-bottom">
          <div className="inputWrap">
            <div className="label">File Name</div>
            <Input className="input" placeholder="" variant='filled' />
          </div>
          <div className="uploadWrap">
            <div className="label"></div>
            <div className="upload">
              <Dragger {...props} className="uploadInput">
                <p className="ant-upload-text">Upload file</p>
                <p className="ant-upload-hint">Any file type. Max 300kb</p>
                <p className="ant-upload-drag-icon">
                  <img src={uploadIcon} alt="" />
                </p>
              </Dragger>
            </div>
          </div>
          <Row gutter={[24,24]}>
            <Col offset={4} span={20}>
              <SeleceFeeRate feeRate={feeRate} setFeeRate={setFeeRate} />
            </Col>
            <Col offset={4} span={20}>
              {!connected ? (
                <Button
                  block
                  className="submit"
                  size="large"
                  type="primary"
                  onClick={connect}
                >
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  block
                  size="large"
                  loading={submiting}
                  type="primary"
                  onClick={submit}
                  className="submit"
                >
                  Submit
                </Button>
              )}
            </Col>
          </Row>
        </div>
      )}
      {tab === "Buzz" && (
        <div className="form3 animation-slide-bottom">
          <Form
            {...formItemLayout}
            variant="filled"
            style={{ maxWidth: "100vw", width: 632 }}
          >
            <Form.Item label="Buzz" name="TextArea">
              <TextArea
                placeholder=""
                allowClear
                onChange={onChange}
                className="textarea"
                autoSize={false}
                style={{ height: 222 }}
                value={buzz}
              />
            </Form.Item>
            <Form.Item label="Fee Rate" name="TextArea">
              <SeleceFeeRate feeRate={feeRate} setFeeRate={setFeeRate} />
            </Form.Item>
          </Form>
          <Row>
            <Col offset={4} span={20}>
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
            </Col>
          </Row>

          {/* </div> */}
        </div>
      )}
      {tab === "PINs" && (
        <div className="form2 animation-slide-bottom">
          <Form
            {...formItemLayout}
            variant="filled"
            style={{ maxWidth: "100vw", width: 632 }}
          >
            <Form.Item label="Path" name="Input">
              <Input size="large" />
            </Form.Item>

            <Form.Item label="InputNumber" name="InputNumber">
              <Input size="large" />
            </Form.Item>

            <Form.Item label="Payload" name="TextArea">
              <Input.TextArea
                size="large"
                autoSize={false}
                style={{ height: 222 }}
              />
            </Form.Item>
            <Form.Item label="Fee Rate" name="TextArea">
              <SeleceFeeRate feeRate={feeRate} setFeeRate={setFeeRate} />
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  );
};
