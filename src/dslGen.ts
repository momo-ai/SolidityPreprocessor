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
    Mutability,
    FunctionCallKind
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
}


export class DSLGen extends AstCopy {
    dsl:Map<string, ASTNode>;
    dslDefs:Map<number, Set<string>>;
    getters:Map<number, FunctionDefinition>;
    setters:Map<number, FunctionDefinition>;
    setterToGetter:Map<number, number>;
    nameGen:NameGenerator;
    typeConvert:TypeConvert;
    isSet:boolean;

    constructor() {
        super();
        this.dsl = new Map<string, ASTNode>();
        this.getters = new Map<number, FunctionDefinition>();
        this.setters = new Map<number, FunctionDefinition>();
        this.setterToGetter = new Map<number, number>();
        this.isSet = false;
        this.dslDefs = new Map<number, Set<string>>();
        this.nameGen = new NameGenerator();
        this.typeConvert = new TypeConvert();
    }

    extractExternalFunction(node:ASTNode):FunctionDefinition {
        if(node instanceof MemberAccess) {
            return node.context.locate(node.referencedDeclaration) as FunctionDefinition;
        }

        return undefined;
    }

    getterName(varname:string): string {
        return "v__get_" + varname;
    }

    setterName(varname:string): string {
        return "v__set_" + varname;
    }

    register(...nodes:ASTNode[]):void {
        for(const node of nodes) {
            this.context.register(node);
        }
    }

    /*declParams_ElementaryTypeName(t:ElementaryTypeName):VariableDeclaration[] {
        const varName:string = "p" + string(t.id);
        return new VariableDeclaration(this.id++, this.srcStr, false, false, varName, node.scope, false, DataLocation.Default, StateVariableVisibility.Default, Mutability.Immutable, t.typeString, undefined, t, undefined, undefined, undefined, undefined);
    }

    declParams_UserDefinedTypeName(t:UserDefinedTypeName): VariableDeclaration[] {
        const varName:string = "p" + string(t.id);
        return new VariableDeclaration(this.id++, this.srcStr, false, false, varName, node.scope, false, DataLocation.Default, StateVariableVisibility.Default, Mutability.Immutable, t.typeString, undefined, t, undefined, undefined, undefined, undefined);
    }*/

    getVarName(t:TypeName, pre:string):string {
        return pre + t.id;
    }

    getExpr_ArrayTypeName(t:ArrayTypeName, params:VariableDeclaration[], nextParam:number, expr:Expression): Expression {
        const base:Expression = this.getExpr_TypeName(t.vBaseType, params, nextParam + 1, expr);
        const key:Identifier = new Identifier(this.id++, this.srcStr, "uint256", params[nextParam].name, params[nextParam].id, undefined)
        const access:IndexAccess = new IndexAccess(this.id++, this.srcStr, t.typeString, base, key, undefined);
        this.register(key, access);
        return access;
    }

    getExpr_Mapping(t:Mapping, params:VariableDeclaration[], nextParam:number, expr:Expression): Expression {
        const val:Expression = this.getExpr_TypeName(t.vValueType, params, nextParam + 1, expr);
        const key:Identifier = new Identifier(this.id++, this.srcStr, t.vKeyType.typeString, params[nextParam].name, params[nextParam].id, undefined)
        const access:IndexAccess = new IndexAccess(this.id++, this.srcStr, t.typeString, val, key, undefined);
        this.register(key, access);
        return access;
    }

    getExpr_TypeName(t:TypeName, params:VariableDeclaration[], nextParam:number, expr:Expression): Expression {
        if(t instanceof Mapping) {
            return this.getExpr_Mapping(t, params, nextParam, expr);
        }
        if(t instanceof ArrayTypeName) {
            return this.getExpr_ArrayTypeName(t, params, nextParam, expr);
        }

        return expr;
    }

    getExpr(v:VariableDeclaration, params:VariableDeclaration[]): Expression {
        const ident:Identifier = new Identifier(this.id++, this.srcStr, v.typeString, v.name, v.id, undefined);
        this.register(ident);
        return this.getExpr_TypeName(v.vType, params.reverse(), 0, ident);
    }


    declParams_Mapping(t:Mapping):VariableDeclaration[] {
        const keyVar:VariableDeclaration =  new VariableDeclaration(this.id++, this.srcStr, false, false, this.getVarName(t.vKeyType, "p"), this.curContract.id, false, DataLocation.Default, StateVariableVisibility.Internal, Mutability.Mutable, t.vKeyType.typeString, undefined, t.vKeyType, undefined, undefined, undefined, undefined);
        this.register(keyVar);

        return [keyVar].concat(this.declParams_TypeName(t.vValueType));
    }

    declParams_ArrayTypeName(t:ArrayTypeName):VariableDeclaration[] {
        const indType:ElementaryTypeName = new ElementaryTypeName(this.id++, this.srcStr, "uint256", "uint256", "nonpayable", undefined);
        const indVar:VariableDeclaration =  new VariableDeclaration(this.id++, this.srcStr, false, false, this.getVarName(t, "p"), this.curContract.id, false, DataLocation.Default, StateVariableVisibility.Internal, Mutability.Mutable, indType.typeString, undefined, indType, undefined, undefined, undefined, undefined);
        this.register(indType, indVar);

        return [indVar].concat(this.declParams_TypeName(t.vBaseType));
    }

    declParams_TypeName(t:TypeName):VariableDeclaration[] {
        if(t instanceof Mapping) {
            return this.declParams_Mapping(t);
        }
        if(t instanceof ArrayTypeName) {
            return this.declParams_ArrayTypeName(t);
        }

        return []
    }


    baseType_ArrayTypeName(t:ArrayTypeName): TypeName {
        return this.baseType_TypeName(t.vBaseType);
    }

    baseType_Mapping(t:Mapping):TypeName {
        return this.baseType_TypeName(t.vValueType);
    }

    baseType_TypeName(t:TypeName):TypeName {
        if(t instanceof ArrayTypeName) {
            return this.baseType_ArrayTypeName(t);
        }
        if(t instanceof Mapping) {
            return this.baseType_Mapping(t);
        }

        return t;
    }

    getBaseTypeDecl(t:TypeName, name:string):VariableDeclaration {
        const baseType:TypeName = this.baseType_TypeName(t);
        const retVar:VariableDeclaration =  new VariableDeclaration(this.id++, this.srcStr, false, false, name, this.curContract.id, false, DataLocation.Default, StateVariableVisibility.Internal, Mutability.Mutable, baseType.typeString, undefined, baseType, undefined, undefined, undefined, undefined);
        this.register(retVar);
        return retVar;
    }

    createGetter(node:VariableDeclaration): FunctionDefinition {
        const name:string = this.getterName(node.name);
        const paramList:VariableDeclaration[] = this.declParams_TypeName(node.vType);
        const params = new ParameterList(this.id++, this.srcStr, paramList);
        const retDecl:VariableDeclaration = this.getBaseTypeDecl(node.vType, this.getVarName(node.vType, "ret"));
        const rets:ParameterList = new ParameterList(this.id++, this.srcStr, [retDecl]);
        //const varRef:Identifier = new Identifier(this.id++, this.srcStr, node.typeString, node.name, node.id, undefined);
        const expr:Expression = this.getExpr(node, paramList);
        const retStmt:Return = new Return(this.id++, this.srcStr, rets.id, expr, undefined, undefined);
        const body:Block = new Block(this.id++, this.srcStr, [retStmt], undefined);
        const getter:FunctionDefinition = new FunctionDefinition(this.id++, this.srcStr, node.scope, FunctionKind.Function, name, false, FunctionVisibility.Public, FunctionStateMutability.View, false, params, rets, [], undefined, body, undefined, undefined, undefined);
        this.register(params, rets, retStmt, body, getter);
        return getter;
    }

    getSet(node:VariableDeclaration, accessList:VariableDeclaration[], setVal:VariableDeclaration, rets:ParameterList): Return {
        const lhs:Expression = this.getExpr(node, accessList);
        const rhs:Expression = new Identifier(this.id++, this.srcStr, setVal.typeString, setVal.name, setVal.id, undefined);
        const assign:Assignment = new Assignment(this.id++, this.srcStr, setVal.typeString, "=", lhs, rhs, undefined);
        const ret:Return = new Return(this.id++, this.srcStr, rets.id, assign, undefined, undefined);
        this.register(rhs, assign, ret);
        return ret;
    }

    createSetter(node:VariableDeclaration): FunctionDefinition {
        const name:string = this.setterName(node.name);
        const accessList:VariableDeclaration[] = this.declParams_TypeName(node.vType);
        const setDecl:VariableDeclaration = this.getBaseTypeDecl(node.vType, this.getVarName(node.vType, "set"));
        const retDecl:VariableDeclaration = this.getBaseTypeDecl(node.vType, this.getVarName(node.vType, "ret"));
        const paramList:VariableDeclaration[] = accessList.concat([setDecl])
        const params:ParameterList = new ParameterList(this.id++, this.srcStr, paramList);
        const rets:ParameterList = new ParameterList(this.id++, this.srcStr, [retDecl]);
        const retStmt:Return = this.getSet(node, accessList, setDecl, rets);
        const body:Block = new Block(this.id++, this.srcStr, [retStmt], undefined);
        const setter:FunctionDefinition = new FunctionDefinition(this.id++, this.srcStr, node.scope, FunctionKind.Function, name, false, FunctionVisibility.Public, FunctionStateMutability.NonPayable, false, params, rets, [], undefined, body, undefined, undefined, undefined);
        this.register(params, rets, body, setter);
        return setter;
    }

    process_VariableDeclaration(node:VariableDeclaration): void {
        super.process_VariableDeclaration(node);
        const id:number = this.getNewId(node, node.id);
        const decl:VariableDeclaration = this.context.locate(id) as VariableDeclaration;
        if(node.stateVariable) {
            console.log("starting");
            const getter:FunctionDefinition = this.createGetter(decl);
            this.getters.set(decl.id, getter);
            this.parent.appendChild(getter);
            const setter:FunctionDefinition = this.createSetter(decl);
            this.setters.set(decl.id, setter);
            this.setterToGetter.set(setter.id, getter.id);
            this.parent.appendChild(setter);
        }
    }


    process_Identifier(node:Identifier): void {
        const refId:number = this.getNewId(node, node.referencedDeclaration);
        const ref = this.context.locate(refId);
        if(ref instanceof VariableDeclaration && ref.stateVariable) {
            console.log(ref)
            if(this.isSet) {
                const ident:Identifier = new Identifier(this.id++, this.srcStr, node.typeString, this.setters.get(refId).name, this.setters.get(refId).id);
                const call:FunctionCall = new FunctionCall(this.id++, this.srcStr, node.typeString, FunctionCallKind.FunctionCall, ident, []);
                this.isSet = false;
                this.register(ident);
                super.addNode(node, call);
                return;
            }

            const ident:Identifier = new Identifier(this.id++, this.srcStr, node.typeString, this.getters.get(refId).name, this.getters.get(refId).id);
            const call:FunctionCall = new FunctionCall(this.id++, this.srcStr, node.typeString, FunctionCallKind.FunctionCall, ident, []);
            this.register(ident);
            super.addNode(node, call);
            return;
        }

        super.process_Identifier(node);
    }


    process_IndexAccess(node:IndexAccess): void {
        const baseExpr:Expression = this.clone(node.vBaseExpression) as Expression;
        const indexExpr:Expression = this.clone(node.vIndexExpression) as Expression;

        if(baseExpr instanceof FunctionCall) {
            baseExpr.vArguments.push(indexExpr);
            this.parent.appendChild(baseExpr);
            return;
        }

        const access:IndexAccess = new IndexAccess(this.id++, this.srcStr, node.typeString, baseExpr, indexExpr);
        this.addNode(node, access);
    }

    process_Assignment(node:Assignment): void {
        this.isSet = true;
        const lhs:Expression = this.clone(node.vLeftHandSide) as Expression;
        var rhs:Expression = this.clone(node.vRightHandSide) as Expression;

        if(lhs instanceof FunctionCall) {
            if(node.operator != "=") {
                const setIdent:Identifier = lhs.vExpression as Identifier;
                const getter:FunctionDefinition = this.context.locate(this.setterToGetter.get(setIdent.referencedDeclaration)) as FunctionDefinition;
                const ident:Identifier = new Identifier(this.id++, this.srcStr, lhs.typeString, getter.name, getter.id);
                const getCall:FunctionCall = new FunctionCall(this.id++, this.srcStr, lhs.typeString, FunctionCallKind.FunctionCall, ident, [... lhs.vArguments])
                const binOp:BinaryOperation = new BinaryOperation(this.id++, this.srcStr, rhs.typeString, node.operator.substring(0, node.operator.length - 1), getCall, rhs);
                this.register(ident, getCall, binOp);
                rhs = binOp;
            }
            lhs.vArguments.push(rhs);
            this.parent.appendChild(lhs);
            return;
        }

        const newAssign:Assignment = new Assignment(this.id++, this.srcStr, node.typeString, node.operator, lhs, rhs);
        this.addNode(node, newAssign);
    }

























    /*convertElementaryType(str:string):ElementaryTypeName | undefined{
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
    }*/
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



















