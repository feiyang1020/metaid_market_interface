import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Tooltip,
  Upload,
  UploadFile,
  UploadProps,
  message,
  Grid,
  Select,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import "./index.less";
import btcIcon from "@/assets/logo_btc@2x.png";
import { FileToAttachmentItem, formatSat, image2Attach } from "@/utils/utlis";
import { useModel, useMatch, useNavigate } from "umi";
import { CreateOptions, IBtcConnector, IBtcEntity } from "@metaid/metaid";
import uploadIcon from "@/assets/upload.svg";
import { getCreatePinFeeByNet } from "@/config";
import SuccessModal, {
  DefaultSuccessProps,
  SuccessProps,
} from "@/components/SuccessModal";
import Mrc20Form from "./components/Mrc20Form";
import { InscribeData } from "node_modules/@metaid/metaid/dist/core/entity/btc";
import { UploadOutlined } from "@ant-design/icons";
const items = ['MRC-20', "File", "Buzz", "PINs",];
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
const { useBreakpoint } = Grid;

export default () => {
  const match = useMatch('/inscribe/:tab');
  const _tab = match?.params.tab;
  const nav = useNavigate()
  const { sm } = useBreakpoint();
  const [tab, setTab] = useState<"File" | "Buzz" | "PINs" | "MRC-20">("MRC-20");
  const [submiting, setSubmiting] = useState(false);
  const { btcConnector, connected, connect, feeRate, network, disConnect } =
    useModel("wallet");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [buzz, setBuzz] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [path, setPath] = useState<string>("/protocols");
  const [contentType, setContentType] = useState<string>("text/plain");
  const [successProp, setSuccessProp] =
    useState<SuccessProps>(DefaultSuccessProps);
  const checkPath = useMemo(() => {
    const regex = /^\/[a-zA-Z0-9]+(\/[a-zA-Z0-9]+)*\/?$/;
    return regex.test(path);
  }, [path]);

  const checkPayload = useMemo(() => {
    if (contentType === "text/plain") return true;
    try {
      if (typeof JSON.parse(payload) === "object") {
        return true;
      }
    } catch (err) { }
    return false;
  }, [payload, contentType]);

  useEffect(() => {
    if (_tab) {
      setTab(_tab)
    }

  }, [_tab])


  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBuzz(e.target.value);
  };

  const checkWallet = async () => {
    if (!btcConnector) return false;
    const address = await window.metaidwallet.btc.getAddress();
    if (address !== btcConnector.wallet.address) {
      disConnect();
      return false;
    }
    return true;
  };
  const submit = async () => {
    if (!feeRate || fileList.length === 0 || !btcConnector) return;
    try {
      setSubmiting(true);
      const pass = await checkWallet();
      if (!pass) throw new Error("Account change");
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

      const ret = await fileEntity.create({
        dataArray: fileOptions,
        options: {
          noBroadcast: "no",
          feeRate: Number(feeRate),
          service: getCreatePinFeeByNet(network),
        }

      });
      if (ret.status) throw new Error(ret.status);
      console.log(ret, "ret");
      const [revealTxId] = ret.revealTxIds
      if (revealTxId) {
        setSuccessProp({
          show: true,
          onClose: () => setSuccessProp(DefaultSuccessProps),
          onDown: () => {
            setSuccessProp(DefaultSuccessProps);
            setFileList([]);
          },
          title: "Inscribe",
          tip: "Successful",
          children: (
            <div className="inscribeSuccess">
              <div className="res">
                <div className="item">
                  <div className="label">Transaction Cost</div>
                  <div className="value">
                    <img src={btcIcon}></img> {formatSat(ret.totalCost)}
                  </div>
                </div>
                <div className="item">
                  <div className="label">TxId </div>
                  <div className="value">
                    <Tooltip title={revealTxId}>
                      <a
                        style={{ color: "#fff", textDecoration: "underline" }}
                        target="_blank"
                        href={
                          network === "testnet"
                            ? `https://mempool.space/testnet/tx/${revealTxId}`
                            : `https://mempool.space/tx/${revealTxId}`
                        }
                      ><Typography.Text copyable={{ text: revealTxId }}>
                          {revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                        </Typography.Text>
                      </a>
                    </Tooltip>
                  </div>
                </div>

                <div className="item">
                  <div className="label">Metafile URI </div>
                  <div className="value">
                    <Tooltip title={`metafile://${revealTxId}i0`}>
                      <Typography.Text copyable={{ text: `metafile://${revealTxId}i0` }}> metafile://{revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}i0</Typography.Text>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ),
        });
      } else {
        throw new Error("unknow error");
      }
    } catch (err) {
      console.log(err, typeof err === 'string');
      message.error(typeof err === 'string' ? err : err.message);
    }
    setSubmiting(false);
  };

  const submitBuzz = async () => {
    if (!buzz || !feeRate || !btcConnector) return;
    setSubmiting(true);
    try {
      const pass = await checkWallet();
      if (!pass) throw new Error("Account change");
      const buzzEntity = await btcConnector!.use("buzz");
      const ret = await buzzEntity!.create({
        dataArray: [{
          body: JSON.stringify({ content: buzz }), contentType: "text/plain",
          flag: network === "mainnet" ? "metaid" : "testid",
        }],
        options: {
          noBroadcast: "no",
          feeRate: Number(feeRate),
          service: getCreatePinFeeByNet(network),
        },

      });
      if (ret.status) throw new Error(ret.status);
      const [revealTxId] = ret.revealTxIds
      if (revealTxId) {
        setSuccessProp({
          show: true,
          onClose: () => setSuccessProp(DefaultSuccessProps),
          onDown: () => {
            setSuccessProp(DefaultSuccessProps);
            setBuzz("");
          },
          title: "Inscribe",
          tip: "Successful",
          children: (
            <div className="inscribeSuccess">
              <div className="res">
                <div className="item">
                  <div className="label">Transaction Cost</div>
                  <div className="value">
                    <img src={btcIcon}></img> {formatSat(ret.totalCost)}
                  </div>
                </div>
                <div className="item">
                  <div className="label">TxId </div>
                  <div className="value">
                    <Tooltip title={revealTxId}>
                      <a
                        style={{ color: "#fff", textDecoration: "underline" }}
                        target="_blank"
                        href={
                          network === "testnet"
                            ? `https://mempool.space/testnet/tx/${revealTxId}`
                            : `https://mempool.space/tx/${revealTxId}`
                        }
                      >
                        <Typography.Text copyable={{ text: revealTxId }}>
                          {revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}
                        </Typography.Text>
                      </a>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ),
        });
      } else {
        throw new Error("unknow error");
      }
    } catch (err: any) {
      console.log(err, typeof err === 'string');
      message.error(typeof err === 'string' ? err : err.message);
    }
    setSubmiting(false);
  };

  const inscribe = async () => {
    if (!btcConnector || !path || !payload || !checkPath) return;

    try {
      setSubmiting(true);
      const pass = await checkWallet();
      if (!pass) throw new Error("Account change");
      const metaidData: InscribeData = {
        operation: "create",
        body: payload,
        path: path,
        contentType: contentType,
        flag: network === "mainnet" ? "metaid" : "testid",
      };

      const ret = await btcConnector.inscribe({
        inscribeDataArray: [metaidData],
        options: {
          noBroadcast: "no",
          feeRate: Number(feeRate),
          service: getCreatePinFeeByNet(network),
        }
      }
      );
      if (ret.status) throw new Error(ret.status);
      const [revealTxId] = ret.revealTxIds
      if (revealTxId) {
        setSuccessProp({
          show: true,
          onClose: () => setSuccessProp(DefaultSuccessProps),
          onDown: () => {
            setSuccessProp(DefaultSuccessProps);
            setPayload("");
          },
          title: "Inscribe",
          tip: "Successful",
          children: (
            <div className="inscribeSuccess">
              <div className="res">
                <div className="item">
                  <div className="label">Transaction Cost</div>
                  <div className="value">
                    <img src={btcIcon}></img> {formatSat(ret.totalCost)}
                  </div>
                </div>
                <div className="item">
                  <div className="label">TxId </div>
                  <div className="value">
                    <Tooltip title={revealTxId}>
                      <a
                        style={{ color: "#fff", textDecoration: "underline" }}
                        target="_blank"
                        href={
                          network === "testnet"
                            ? `https://mempool.space/testnet/tx/${revealTxId}`
                            : `https://mempool.space/tx/${revealTxId}`
                        }
                      > <Typography.Text copyable={{ text: revealTxId }}>{revealTxId.replace(/(\w{5})\w+(\w{5})/, "$1...$2")}</Typography.Text>

                      </a>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ),
        });
      } else {
        throw new Error(typeof ret === "string" ? ret : "unknow error");
      }
    } catch (err: any) {
      console.log(err, typeof err === 'string');
      message.error(typeof err === 'string' ? err : err.message);
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
        message.error("file must smaller than 300k!");
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
              onClick={() => { nav('/inscribe/' + item); setTab(item) }}
              size="large"
            >
              {item}
            </Button>
          ))}
        </Space>
      </div>
      <div className="inscribeForm">


        {tab === "File" && (
          <div className="animation-slide-bottom">
            <Row>
              <Col
                offset={sm ? 4 : 0}
                span={sm ? 20 : 24}
                style={{ paddingBottom: 24 }}
              >
                <div className="uploadWrap">
                  <div className="label"></div>
                  <div className="upload" >
                    <Dragger {...props} className="uploadInput" listType={fileList && fileList[0] && fileList[0].type?.includes('image') ? 'picture' : 'text'}>
                      <p className="ant-upload-text">Upload File</p>
                      <p className="ant-upload-hint">Any file type. Max 300kb</p>
                      <p className="colorPrimary">
                        <UploadOutlined style={{fontSize:24}} />

                      </p>
                      <p className="colorPrimary">Choose File</p>
                    </Dragger>
                  </div>
                </div>
              </Col>
            </Row>
            <Form
              {...formItemLayout}
              variant="filled"
              style={{ maxWidth: "96vw", width: 632 }}
            >

            </Form>
            <Row gutter={[0, 0]}>
              <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}>
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
                    disabled={!feeRate || fileList.length === 0}
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
              style={{ maxWidth: "96vw", width: 632 }}
            >
              <Form.Item label="Content" name="TextArea">
                <TextArea
                  placeholder=""
                  allowClear
                  onChange={onChange}
                  className="textarea"
                  autoSize={false}
                  style={{ height: 340 }}
                  value={buzz}
                />
              </Form.Item>

            </Form>
            <Row>
              <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}>
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
                    disabled={!feeRate || !buzz}
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
          <div className="form4 animation-slide-bottom">
            <Form
              {...formItemLayout}
              variant="filled"
              style={{ maxWidth: "96vw", width: 632 }}
              initialValues={{
                path: "/protocols",
                contentType: "text/plain",
                Operation: "Create",
              }}
            >
              <Form.Item label="Operation" name="Operation">
                <Input size="large" disabled />
              </Form.Item>
              <Form.Item label="Path" name="path">
                <Input
                  size="large"
                  status={checkPath ? "" : "error"}
                  value={path}
                  onChange={(e) => {
                    setPath(e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item label="Content-type" name="contentType">
                <Select
                  size="large"
                  style={{ textAlign: "left" }}
                  onChange={(e) => {
                    setContentType(e);
                  }}
                >
                  <Select.Option value="application/json">
                    application/json
                  </Select.Option>
                  <Select.Option value="text/plain">text/plain</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Payload" name="TextArea">
                <Input.TextArea
                  size="large"
                  autoSize={false}
                  style={{ height: 240 }}
                  value={payload}
                  status={checkPayload ? "" : "error"}
                  onChange={(e) => {
                    setPayload(e.target.value);
                  }}
                />
              </Form.Item>

            </Form>

            <Row gutter={[0, 0]}>
              <Col offset={sm ? 4 : 0} span={sm ? 20 : 24}>
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
                    onClick={inscribe}
                    disabled={
                      !feeRate || !path || !payload || !checkPayload || !checkPath
                    }
                    className="submit"
                  >
                    Submit
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        )}
        {tab === "MRC-20" && <Mrc20Form setTab={setTab} />}
      </div>
      <SuccessModal {...successProp}></SuccessModal>
    </div>
  );
};
