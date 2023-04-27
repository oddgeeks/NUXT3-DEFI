interface IZerionNFT {
    links: {
        self: string;
    },
    data: ZerionNFTData[]
}

interface ZerionNFTData {
    type: string
    id: string
    attributes: Attributes
    relationships: Relationships
}

interface Attributes {
    changed_at: string
    amount: string
    price: number
    value: number
    nft_info: NftInfo
    collection_info: CollectionInfo
}

interface NftInfo {
    contract_address: string
    token_id: string
    name: string
    interface: string
    content: Content
}

interface Content {
    preview: Preview
    detail: Detail
}

interface Preview {
    url: string
}

interface Detail {
    url: string
}

interface CollectionInfo {
    name: string
    description: string
    content: Content2
}

interface Content2 {
    icon: Icon
    banner: Banner
}

interface Icon {
    url: string
}

interface Banner {
    url: string
}

interface Relationships {
    chain: Chain
    nft: Nft
}

interface Chain {
    links: Links
    data: Data
}

interface Links {
    related: string
}

interface Data {
    type: string
    id: string
}

interface Nft {
    data: Data
}
