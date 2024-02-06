export interface Formula {
    name: string;
    template: string,
    property: Property[]
}

export interface Property {
    name: string
    type: PropertyType,
    desc?: FieldDesc | EnumDesc | InputProperty
}

export enum PropertyType {
    Field = "Field",
    Enum = "Enum",
    Input = "Input",
}

export interface FieldDesc {

}

export interface EnumDesc {
    enum: {
        label: string,
        key: string,
    }[]
}

export interface InputProperty {
}


export const formulas: Formula[] = [
    {
        name: '周分组',
        template: 'IF([时间列],FORMAT("【第{1}周】{2}~{3}",TEXT(WEEKNUM([时间列],2),"00"),TEXT([时间列]-WEEKDAY([时间列],2)+1,"MM.DD"),TEXT([时间列]+7-WEEKDAY([时间列],2),"MM.DD")),"0无分组")',
        property: [{
            name: '时间列',
            type: PropertyType.Field,
            desc: {}
        }]
    }
]