const CustomizeRequiredMark = (label: React.ReactNode, { required }: { required: boolean }) => (
    <>
        {label}
        {required ? <></> : <>(<span style={{color:'#d4f66b'}}>Optional</span>)</>}

    </>
);
export default CustomizeRequiredMark;