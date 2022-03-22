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
    UsingForDirective,
    ContractKind,
    FunctionKind,
    FunctionStateMutability,
    FunctionVisibility,
    DataLocation,
    StateVariableVisibility,
    Mutability
} from "solc-typed-ast";

import {
    AstCopy
} from "./copy"

class TypeConvert {
    constructor() {
    }

}

class NameGenerator {
    constructor() {
    }

    sanitize(str:string):string {
        return str;
    }

    gen_BinaryOperation(node:BinaryOperation): string {
        let fnName:string = "";
        switch(node.operator) {
            case "+":
                fnName += "v_add";
                break;
            case "-":
                fnName += "v_sub";
                break;
            case "*":
                fnName += "v_mul";
                break;
            case "/":
                fnName += "v_div";
                break;
            case "%":
                fnName += "v_mod";
                break;
            case "==":
                fnName += "v_eq";
                break;
            case "!=":
                fnName += "v_neq";
                break;
            case "<":
                fnName += "v_lt";
                break;
            case "<=":
                fnName += "v_leq";
                break;
            case ">":
                fnName += "v_gt";
                break;
            case ">=":
                fnName += "v_geq";
                break;
            case "&&":
                fnName += "v_land";
                break;
            case "||":
                fnName += "v_lor";
                break;
            case "&":
                fnName += "v_band";
                break;
            case "|":
                fnName += "v_bor";
                break;
            case "^":
                fnName += "v_xor";
                break;
            case "<<":
                fnName += "v_shl";
                break;
            case ">>":
                fnName += "v_shr";
                break;
            default:
                console.log("Could not find the operator " + node.operator);
                process.exit(1);
        }

        const lhsType:string = this.sanitize(node.vLeftExpression.typeString);
        const rhsType:string = this.sanitize(node.vRightExpression.typeString);
        fnName += "_" + lhsType + "_" + rhsType;
        return fnName;
    }

    gen_UnaryOperation(node:UnaryOperation): string {
        let fnName:string = "";
        switch(node.operator) {
            case "-":
                fnName += "v_neg";
                break;
            case "++":
                fnName += "v_inc";
                break;
            case "--":
                fnName += "v_dec";
                break;
            case "!":
                fnName += "v_lnot";
                break;
            case "~":
                fnName += "v_bnot";
                break;
        }

        const subType:string = this.sanitize(node.vSubExpression.typeString);
        fnName += "_" + subType;
        return fnName;
    }
}

export class DSLGen extends AstCopy {
    dsl:Map<string, ASTNode>;
    dslDefs:Map<number, Set<string>>;
    nameGen:NameGenerator;
    typeConvert:TypeConvert;

    constructor() {
        super();
        this.dsl = new Map<string, ASTNode>();
        this.dslDefs = new Map<number, Set<string>>();
        this.nameGen = new NameGenerator();
        this.typeConvert = new TypeConvert();
    }

    convertElementaryType(str:string):ElementaryTypeName | undefined{
        let payable:boolean = str.includes("payable");

        if(str.startsWith("uint") || str.startsWith("int") || str.startsWith("bool") || str.startsWith("address")) {
            if(payable) {
                return new ElementaryTypeName(this.id++, this.srcStr, str, str, "payable");
            }
            else {
                return new ElementaryTypeName(this.id++, this.srcStr, str, str, "nonpayable");
            }
        }

        return undefined;
    }

    convertMappingType(str:string):Mapping | undefined{
        return undefined;
    }

    convertUserDefinedType(str:string):UserDefinedTypeName | undefined{
        return undefined;
    }

    convertArrayType(str:string):ArrayTypeName | undefined {
        return undefined;
    }

    convert(str:string):TypeName {
        let result:TypeName | undefined = this.convertElementaryType(str);
        if(result != undefined) {
            return result;
        }

        result = this.convertMappingType(str);
        if(result != undefined) {
            return result;
        }

        result = this.convertUserDefinedType(str);
        if(result != undefined) {
            return result;
        }

        result = this.convertArrayType(str)
        if(result != undefined) {
            return result;
        }

        console.log("Unknown type string: " + str);
        process.exit(1);
    }


    register(node:ASTNode) {
        this.context.register(node);
    }

    declareParam(name:string, expr:Expression): Identifier {
        let paramType:TypeName = this.convert(expr.typeString);
        const decl:VariableDeclaration = new VariableDeclaration(this.id++, this.srcStr, false, false, name, this.curContract.id, false, DataLocation.Default, StateVariableVisibility.Default, Mutability.Mutable, paramType.typeString, undefined, paramType, undefined, undefined, undefined);
        this.register(decl);
        const ident:Identifier = new Identifier(this.id++, this.srcStr, paramType.typeString, name, decl.id);
        this.register(ident);
        return ident;
    }

    createDSLFn(fnName:string, mutability:FunctionStateMutability, args:Identifier[], expr:Expression) {
        console.log(this.curContract.id);
        console.log(this.dslDefs);
        if(this.dslDefs.get(this.curContract.id).has(fnName)) {
            return;
        }
        
        let decls:VariableDeclaration[] = [];
        for(const ident of args) {
            const decl:VariableDeclaration = this.context.locate(ident.referencedDeclaration) as VariableDeclaration;
            decls.push(decl);
        }
        const params:ParameterList = new ParameterList(this.id++, this.srcStr, decls);
        this.register(params);

        let paramType:TypeName = this.convert(expr.typeString);
        const retDecl:VariableDeclaration = new VariableDeclaration(this.id++, this.srcStr, false, false, "", this.curContract.id, false, DataLocation.Default, StateVariableVisibility.Default, Mutability.Mutable, expr.typeString, undefined, paramType, undefined, undefined, undefined);
        this.register(retDecl);
        const ret:ParameterList = new ParameterList(this.id++, this.srcStr, [retDecl]);
        this.register(ret);

        const retStmt:Return = new Return(this.id++, this.srcStr, ret.id, expr);
        this.register(retStmt);
        const body:Block = new Block(this.id++, this.srcStr, [retStmt], undefined);
        this.register(body);

        const dslFn:FunctionDefinition = new FunctionDefinition(this.id++, this.srcStr, this.curContract.id, FunctionKind.Function, fnName, false, FunctionVisibility.Public, mutability, false, params, ret, [], undefined, body, undefined, undefined);
        this.register(dslFn);
        this.curContract.appendChild(dslFn);
    }

    //function involeDslFn(fnName:string, ) {
    //}

    fetchContractDeps(oldDef:ContractDefinition, newDef:ContractDefinition) {
        super.fetchContractDeps(oldDef, newDef);
        let preDefs:Set<string> = new Set<string>();
        for(const baseId of oldDef.linearizedBaseContracts) {
            const newId:number = this.getNewId(oldDef, baseId);
            if(this.dslDefs.has(newId)) {
                for(const def of this.dslDefs.get(newId)) {
                    preDefs.add(def);
                }
            }
        }
        this.dslDefs.set(newDef.id, preDefs);
    }

    process_BinaryOperation(node:BinaryOperation) {
        const fnName:string = this.nameGen.gen_BinaryOperation(node);
        const lhsType:string = node.vLeftExpression.typeString;
        const rhsType:string = node.vRightExpression.typeString;

        const ident1:Identifier = this.declareParam("a", node.vLeftExpression);
        const ident2:Identifier = this.declareParam("b", node.vRightExpression);
        const body:BinaryOperation = new BinaryOperation(this.id++, this.srcStr, node.typeString, node.operator, ident1, ident2);
        this.register(body);
        this.createDSLFn(fnName, FunctionStateMutability.Pure, [ident1, ident2], body);
        super.process_BinaryOperation(node);
    }
}











/*function gen_MemberAccess(node:MemberAccess) {
}

function gen_IndexAccess(node:IndexAccess) {
    string baseType = sanitize(node.vBaseExpression.typeString);
    string indType = sanitize(node.vIndexExpression.typeString);
    string retType = sanitize(node.typeString);
    string fnName = "v_ind_" + baseType + "_" + indType + "_" + retType;
}

function gen_IndexRangeAccess(node:IndexRangeAccess) {
    string baseType = sanitize(node.vBaseExpression.typeString);
    string startType = sanitize(node.vIndexExpression.typeString);
    //string endType = sanitize(node.vIndexExpression.typeString);
    string retType = sanitize(node.typeString);
    string fnName = "v_rind_" + baseType + "_" + startType + "_" + retType;
}

function gen_NewExpression(node:NewExpression) {
    string newType = sanatize(node.vTypeName.typeString);
    string fnName = "v_create_" + newType;
}

function gen_Identifier(node:Identifier) {
    fnName = "";
    if(node.id == -1) {
        switch(node.name) {
            case "this":
                fnName = "v_this";
                break;
            case "now":
                fnName = "v_now";
                break;
        }
    }
    else {
    }
}

function getFnRef(expr:Expression):number {
    if(expr instanceof Identifier) {
        return (expr as Expression).referencedDeclaration;
    }
    else if(expr instanceof MemberAccess) {
        return (expr as MemberAccess).referencedDeclaration;
    }
    else if(expr instanceof ElementaryTypeNameExpression) {
    }
    else if(expr instanceof NewExpression) {
    }
    else {
        console.exit(1);
    }
}

function gen_FunctionCall(node:FunctionCall) {
}

function gen_Conditional(node:Conditional) {
    string exprType = sanitize(node.typeString);
    string fnName = "v_tern_" + exprType;
}*/



















