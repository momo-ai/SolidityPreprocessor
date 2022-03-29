import { 
        ASTNode,
        ASTNodeWithChildren,
        ASTReader,
        ASTWriter,
        CompilerKind,
        compileSol,
        compileSourceString,
        ContractDefinition,
        DefaultASTWriterMapping,
        ElementaryTypeName,
        ElementaryTypeNameExpression,
        EventDefinition,
        FunctionDefinition,
        FunctionTypeName,
        ModifierDefinition,
        ParameterList,
        PossibleCompilerKinds,
        PrettyFormatter,
        SourceUnit,
        VariableDeclaration,
        CompileResult,
        CompileFailedError,
        PragmaDirective,
        EnumValue,
        EnumDefinition,
        IdentifierPath,
        UserDefinedTypeName,
        Block,
        IfStatement,
        ExpressionStatement,
        Assignment,
        BinaryOperation,
        MemberAccess,
        Identifier,
        FunctionCall,
        Literal,
        Return,
        StructDefinition,
        DoWhileStatement,
        UnaryOperation,
        StructuredDocumentation,
        ForStatement,
        TupleExpression,
        VariableDeclarationStatement,
        ASTContext,
        OverrideSpecifier,
        TypeName,
        Expression,
        ErrorDefinition,
        UserDefinedValueTypeDefinition,
        ModifierInvocation,
        WhileStatement,
        Statement,
        NewExpression,
        Conditional,
        IndexAccess,
        IndexRangeAccess,
        FunctionCallOptions,
        UncheckedBlock,
        EmitStatement,
        Continue,
        Break,
        Throw,
        PlaceholderStatement,
        RevertStatement,
        TryCatchClause,
        TryStatement,
        ArrayTypeName,
        Mapping,
        ImportDirective,
        InheritanceSpecifier,
        UsingForDirective
} from "solc-typed-ast";

import {
    AstTraverse
} from "./traverse";

class SummaryNode {}

class Summary extends SummaryNode {
    compiler:string;
    version:string;
    contracts:Contract[] = [];
}

class Contract extends SummaryNode {
    id:number;
    name:string;
    inherits:UserType[] = [];
    events:Event[] = [];
    functions:Func[] = [];
    variables:Variable[] = [];
    structs:Struct[] = [];
    enums:Enum[] = [];
}

class StrNode extends SummaryNode {
    str:string;
}

class Event extends SummaryNode {
    name:string;
    params:Variable[] = [];
}

class Func extends SummaryNode {
    isConstructor:boolean;
    name:string;
    params:Variable[] = [];
    returns:Variable[] = [];
    modifiers:string[] = [];
}

class VariableList extends SummaryNode {
    vars:Variable[] = [];
}

class Variable extends SummaryNode {
    name:string;
    type:Type;
}

class Type extends SummaryNode {
}

class UserType extends Type {
    subType:string = "UserType";
    refId:number;
    name:string;
}

class ArrayType extends Type {
    subType:string = "ArrayType";
    name:string;
    base:Type;
}

class ElementaryType extends Type {
    subType:string = "ElementaryType";
    name:string;
}

class MapType extends Type {
    subType:string = "MapType";
    name:string;
    key:Type;
    value:Type;
}

class Struct extends SummaryNode {
    id:number;
    name:string;
    fields:Variable[] = [];
}

class Enum extends SummaryNode {
    id:number;
    name:string;
    values:object = {};
}

class EnumElement extends SummaryNode {
    identifier:string;
    val:number;
}

export class Summarizer extends AstTraverse<SummaryNode> {
    assert(cond:boolean, msg:string): void {
        if(!cond) {
            console.log(msg);
            process.exit(1);
        }
    }

    process_SourceUnit(node:SourceUnit): SummaryNode {
        const contents:SummaryNode[] = this.walkChildren(node);
        let summary:Summary = new Summary();

        for(const sum of contents) {
            if(sum instanceof StrNode) {
                summary.version = (sum as StrNode).str;
            }
            else if(sum instanceof Contract) {
                summary.contracts.push(sum as Contract);
            }
            else {
                this.assert(false, "Malformed Summary: " + sum);
            }
        }

        return summary;
    }

    process_PragmaDirective(node:PragmaDirective): SummaryNode {
        let str:StrNode = new StrNode();
        str.str = node.vValue;
        return str;
    }

    process_ContractDefinition(node:ContractDefinition): SummaryNode {
        const contents:SummaryNode[] = this.walkChildren(node);
        let contract:Contract = new Contract();

        contract.id = node.id;
        contract.name = node.name;
        for(const sum of contents) {
            if(sum instanceof UserType) {
                contract.inherits.push(sum as UserType);
            }
            else if(sum instanceof Event) {
                contract.events.push(sum as Event);
            }
            else if(sum instanceof Func) {
                contract.functions.push(sum as Func);
            }
            else if(sum instanceof Variable) {
                contract.variables.push(sum as Variable);
            }
            else if(sum instanceof Struct) {
                contract.structs.push(sum as Struct);
            }
            else if(sum instanceof Enum) {
                contract.enums.push(sum as Enum);
            }
            else {
                this.assert(false, "Malformed Contract");
            }
        }
        
        return contract;
    }

    process_InteritanceSpecifier(node:InheritanceSpecifier): SummaryNode {
        return this.unitDispatch(node.vBaseType);
    }

    /*
     * Types
     */
    process_IdentifierPath(node:IdentifierPath):SummaryNode {
        let user:UserType = new UserType();
        user.refId = node.referencedDeclaration;
        user.name = node.name;
        return user;
    }

    process_UserDefinedTypeName(node:UserDefinedTypeName): SummaryNode {
        let user:UserType = new UserType();
        user.refId = node.referencedDeclaration;
        user.name = node.typeString;
        return user;
    }

    process_ElementaryTypeName(node:ElementaryTypeName): SummaryNode {
        let elem:ElementaryType = new ElementaryType();
        elem.name = node.name;
        return elem;
    }

    process_ArrayTypeName(node:ArrayTypeName): SummaryNode {
        let arr:ArrayType = new ArrayType();
        arr.name = node.typeString;
        arr.base = this.unitDispatch(node.vBaseType) as Type;
        return arr;
    }

    process_Mapping(node:Mapping): SummaryNode {
        let map:MapType = new MapType();
        map.name = node.typeString;
        map.key = this.unitDispatch(node.vKeyType) as Type;
        map.value = this.unitDispatch(node.vValueType) as Type;
        return map;
    }

    /*
     * Contracts
     */
    process_StructDefinition(node:StructDefinition): SummaryNode {
        const contents:SummaryNode[] = this.walkChildren(node);
        let struct:Struct = new Struct();

        struct.id = node.id;
        struct.name = node.name;
        for(const sum of contents) {
            if(sum instanceof Variable) {
                struct.fields.push(sum as Variable);
            }
            else {
                this.assert(false, "Malformed Struct");
            }
        }

        return struct;
    }

    process_VariableDeclaration(node:VariableDeclaration): SummaryNode {
        let v:Variable = new Variable();
        if(node.name) {
            v.name = node.name;
        }
        v.type = this.unitDispatch(node.vType) as Type;
        return v;
    }

    process_EnumDefinition(node:EnumDefinition): SummaryNode {
        let def:Enum = new Enum();
        def.name = node.name;
        def.id = node.id;

        let i = 0;
        for(const val of node.vMembers) {
            def.values[val.name] = i;
            //def.values.set(i, val.name);
            i++;
        }

        return def;
    }

    process_EventDefinition(node:EventDefinition): SummaryNode {
        let event:Event = new Event();
        event.name = node.name;
        const vars:VariableList = this.unitDispatch(node.vParameters) as VariableList;
        event.params = vars.vars;
        return event;
    }

    process_ModifierInvocation(node:ModifierInvocation): SummaryNode {
        let str:StrNode = undefined;
        const sum:SummaryNode = this.unitDispatch(node);
        if(sum instanceof UserType) {
            str = new StrNode();
            str.str = (sum as UserType).name;
        }
        else if(sum instanceof StrNode) {
            str = sum as StrNode;
        }
        else {
            this.assert(false, "malformed Modifier");
        }
        
        return str;
    }

    process_FunctionDefinition(node:FunctionDefinition): SummaryNode {
        let func:Func = new Func();
        func.isConstructor = node.isConstructor;
        if(node.isConstructor) {
            func.name = "constructor";
        }
        else {
            func.name = node.name;
        }
        const params:VariableList = this.unitDispatch(node.vParameters) as VariableList;
        func.params = params.vars;
        const rets:VariableList = this.unitDispatch(node.vReturnParameters) as VariableList;
        func.returns = rets.vars;
        
        for(const mod of node.vModifiers) {
            const str:StrNode = this.unitDispatch(mod) as StrNode;
            func.modifiers.push(str.str);
        }

        return func;
    }

    process_ParameterList(node:ParameterList): SummaryNode {
        const contents:SummaryNode[] = this.walkChildren(node);
        let vars:VariableList = new VariableList();
        
        for(const sum of contents) {
            if(sum instanceof Variable) {
                vars.vars.push(sum as Variable);
            }
            else {
                this.assert(false, "Malformed VarList");
            }
        }

        return vars;
    }

    process_Identifier(node:Identifier): SummaryNode {
        let str:StrNode = new StrNode();
        str.str = node.name;
        return str;
    }

    preprocess(units: SourceUnit[]):SourceUnit {
        let summary:Summary = new Summary();

        for(const unit of units) {
            const newSummary:Summary = this.unitDispatch(unit) as Summary;
            summary.version = newSummary.version;
            summary.contracts.push(...newSummary.contracts);
        }

        summary.compiler = "Solang"

        console.log(JSON.stringify(summary, null, 2));

        return undefined;
    } 
}







