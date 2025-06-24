import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Divider, Grid } from 'antd';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { getMrc20HotList, getMrc20NewList } from '@/services/api';
import { useModel } from 'umi';
import MRC20Icon from '../MRC20Icon';
import Trans from '../Trans';
import NumberFormat from '../NumberFormat';
import btc from "@/assets/logo_btc@2x.png";
import { formatSat } from '@/utils/utlis';
import USDPrice from '../USDPrice';
const { useBreakpoint } = Grid;
import { history } from 'umi';
import MetaIdAvatar from '../MetaIdAvatar';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
type Props = {
    type: 'hot' | 'new'
}
export default ({ type }: Props) => {
    const { network } = useModel('wallet');
    const { md, xxl, xl, sm } = useBreakpoint();

    const [swiperRef, setSwiperRef] = useState(null);
    const appendNumber = useRef(500);
    const prependNumber = useRef(1);
    // Create array with 500 slides
    const [slides, setSlides] = useState<API.HotItem[]>([]);

    const initData = useCallback(async () => {
        const ret = type === 'hot' ? await getMrc20HotList(network, {
            cursor: 0,
            size: 20,
        }) : await getMrc20NewList(network, {
            cursor: 0,
            size: 20,
        });
        const list = ret.data.list || [];
        setSlides(list)
    }, [network, type])

    useEffect(() => {
        initData();
    }, [initData])

    // const prepend = () => {
    //     setSlides([
    //         `Slide ${prependNumber.current - 2}`,
    //         `Slide ${prependNumber.current - 1}`,
    //         ...slides,
    //     ]);
    //     prependNumber.current = prependNumber.current - 2;
    //     swiperRef.slideTo(swiperRef.activeIndex + 2, 0);
    // };

    // const append = () => {
    //     setSlides([...slides, 'Slide ' + ++appendNumber.current]);
    // };

    // const slideTo = (index) => {
    //     swiperRef.slideTo(index - 1, 0);
    // };
    return (
        <>
            <Swiper
                modules={[Virtual, Navigation,]}
                onSwiper={setSwiperRef}
                slidesPerView={xxl ? 5 : xl ? 4 : md ? 2 : 1}
                centeredSlides={false}
                spaceBetween={16}
                pagination={{
                    type: 'fraction',
                }}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                virtual
                style={{
                    '--swiper-navigation-color': '#D4F66B',
                    '--swiper-pagination-color': '#D4F66B',
                    '--swiper-navigation-size': '10px',
                }}

            >
                {slides.map((slideContent, index) => (
                    <SwiperSlide key={slideContent.tickId} virtualIndex={index} onClick={() => {
                        history.push(`/${slideContent.tag === 'id-coins' ? 'idCoin' : 'mrc20'}/${slideContent.tick}`)
                    }} >
                        <div className="mrc20-hot-item" style={{ display: 'flex', alignItems: 'center' }}>
                            {
                                slideContent.tag === 'id-coins' ? <MetaIdAvatar size={48} avatar={slideContent.deployerUserInfo && slideContent.deployerUserInfo.avatar} /> : <MRC20Icon size={48} tick={slideContent.tick} metadata={slideContent.metaData || ''} />
                            }

                            <div className="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: 8 }}>
                                <div className="name" style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>${slideContent.tick}</div>
                                <div className="symbol" style={{ display: 'flex', alignItems: 'center' }}>
                                    <div className="item" style={{ display: 'flex', alignItems: 'center', fontSize: 12, gap: 10 }}>
                                        <div className="label" style={{ whiteSpace: 'nowrap' }}><Trans>Marketcap</Trans></div>
                                        <div className="value" style={{ fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap' }}><NumberFormat value={slideContent.marketCap} decimal={8} isBig suffix=' BTC' precision={4} /></div>
                                    </div>
                                    <Divider type="vertical" />
                                    <div className="item" style={{ display: 'flex', alignItems: 'center', fontSize: 12, gap: 10 }}>
                                        <div className="label"><Trans>Holders</Trans></div>
                                        <div className="value" style={{ fontWeight: 'bold', color: '#fff' }}><NumberFormat value={slideContent.holders} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Divider />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                            <div className="price " style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img src={btc} className="btcLogo" alt="" style={{ width: 24, height: 24 }} />
                                <span style={{ fontSize: 14, color: '#fff' }}>{formatSat(slideContent.lastPrice)} BTC</span>
                                {/* <USDPrice value={slideContent.lastPrice} decimals={8} /> */}
                            </div>
                            <div className="item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="label">{slideContent.change24H[0] === '-' ? <ArrowDownOutlined style={{ color: '#B94041' }} /> : <ArrowUpOutlined style={{ color: '#40BA68' }} />}</div>
                                <div className="value" style={{ color: slideContent.change24H[0] !== '-' ? '#40BA68' : '#B94041' }}>{slideContent.change24H}</div>
                            </div>
                        </div>

                    </SwiperSlide>
                ))}
                <div className='swiper-button-next'></div>
                <div className='swiper-button-prev'></div>
            </Swiper>

            {/* <p className="append-buttons">
                <button onClick={() => prepend()} className="prepend-2-slides">
                    Prepend 2 Slides
                </button>
                <button onClick={() => slideTo(1)} className="prepend-slide">
                    Slide 1
                </button>
                <button onClick={() => slideTo(250)} className="slide-250">
                    Slide 250
                </button>
                <button onClick={() => slideTo(500)} className="slide-500">
                    Slide 500
                </button>
                <button onClick={() => append()} className="append-slides">
                    Append Slide
                </button>
            </p> */}
        </>
    );
}