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

import {
    AstTraverse
} from "./traverse";


export class DSLGen extends AstCopy {
    dsl:Map<string, ASTNode>;
    getters:Map<number, FunctionDefinition>;
    setters:Map<number, FunctionDefinition>;
    setterToGetter:Map<number, number>;
    isSet:boolean;
    contractToProxies:Map<ContractDefinition, Map<string, FunctionDefinition>>;

    constructor() {
        super();
        this.dsl = new Map<string, ASTNode>();
        this.getters = new Map<number, FunctionDefinition>();
        this.setters = new Map<number, FunctionDefinition>();
        this.setterToGetter = new Map<number, number>();
        this.isSet = false;
        this.contractToProxies = new Map<ContractDefinition, Map<string, FunctionDefinition>>();
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


    fetchContractDeps(oldDef:ContractDefinition, newDef:ContractDefinition) {
        super.fetchContractDeps(oldDef, newDef);
        this.contractToProxies.set(newDef, new Map<string, FunctionDefinition>());
        for(const id of newDef.linearizedBaseContracts) {
            const def:ContractDefinition = this.context.locate(id) as ContractDefinition;
            for(const proxy of this.contractToProxies.get(def)) {
                this.contractToProxies.get(this.curContract).set(proxy[0], proxy[1]);
            }
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
        const getter:FunctionDefinition = new FunctionDefinition(this.id++, this.srcStr, node.scope, FunctionKind.Function, name, false, FunctionVisibility.Internal, FunctionStateMutability.View, false, params, rets, [], undefined, body, undefined, undefined, undefined);
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
        const setter:FunctionDefinition = new FunctionDefinition(this.id++, this.srcStr, node.scope, FunctionKind.Function, name, false, FunctionVisibility.Internal, FunctionStateMutability.NonPayable, false, params, rets, [], undefined, body, undefined, undefined, undefined);
        this.register(params, rets, body, setter);
        return setter;
    }

    process_VariableDeclaration(node:VariableDeclaration): void {
        super.process_VariableDeclaration(node);
        const id:number = this.getNewId(node, node.id);
        const decl:VariableDeclaration = this.context.locate(id) as VariableDeclaration;
        if(node.stateVariable && !node.constant) {
            decl.mutability = node.mutability;
            const getter:FunctionDefinition = this.createGetter(decl);
            this.getters.set(decl.id, getter);
            this.parent.appendChild(getter);
            if(node.mutability != Mutability.Immutable) {
                const setter:FunctionDefinition = this.createSetter(decl);
                this.setters.set(decl.id, setter);
                this.setterToGetter.set(setter.id, getter.id);
                this.parent.appendChild(setter);
            }
        }
    }


    process_Identifier(node:Identifier): void {
        const refId:number = this.getNewId(node, node.referencedDeclaration);
        const ref = this.context.locate(refId);
        if(ref instanceof VariableDeclaration && ref.stateVariable && !ref.constant) {
            if(this.isSet) {
                if(ref.mutability == Mutability.Immutable) {
                    this.isSet = false;
                    super.process_Identifier(node);
                    return;
                }
                else {
                    const ident:Identifier = new Identifier(this.id++, this.srcStr, node.typeString, this.setters.get(refId).name, this.setters.get(refId).id);
                    const call:FunctionCall = new FunctionCall(this.id++, this.srcStr, node.typeString, FunctionCallKind.FunctionCall, ident, []);
                    this.isSet = false;
                    this.register(ident);
                    super.addNode(node, call);
                    return;
                }
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



    extractStaticExternalFunction(node:ASTNode):FunctionDefinition {
        if(node instanceof MemberAccess) {
            return node.context.locate(node.referencedDeclaration) as FunctionDefinition;
        }

        return undefined;
    }

    getContractName(def:FunctionDefinition):string {
        return this.info.fnParent.get(def).name;
    }

    getProxyName(callIdent:MemberAccess, def:FunctionDefinition, call:FunctionCall):string {
        return "v__call_" + this.getContractName(def) + "__function_" + def.name;
    }

    makeFnProxy(callIdent:MemberAccess, def:FunctionDefinition, call:FunctionCall) {
        const proxyName:string = this.getProxyName(callIdent, def, call);
        if(this.contractToProxies.get(this.curContract).has(proxyName)) {
            return this.contractToProxies.get(this.curContract).get(proxyName);
        }

        const tgtContract:string = "_tgt_contract_";
        const contractType:UserDefinedTypeName = new UserDefinedTypeName(this.id++, this.srcStr, callIdent.vExpression.typeString, this.getContractName(def), this.getNewId(call, this.info.fnParent.get(def).id), undefined, undefined);
        const contractParam:VariableDeclaration = new VariableDeclaration(this.id++, this.srcStr, false, false, tgtContract, this.curContract.id, false, DataLocation.Default, StateVariableVisibility.Internal, Mutability.Mutable, contractType.typeString, undefined, contractType, undefined, undefined, undefined, undefined);
        const fnParams:VariableDeclaration[] = super.cloneList(def.vParameters.vParameters) as VariableDeclaration[];
        const paramList:VariableDeclaration[] = [contractParam].concat(fnParams);
        const params:ParameterList = new ParameterList(this.id++, this.srcStr, paramList);
        const retList:VariableDeclaration[] = super.cloneList(def.vReturnParameters.vParameters) as VariableDeclaration[];
        const rets:ParameterList = new ParameterList(this.id++, this.srcStr, retList);

        var args:Expression[] = []
        for(const param of fnParams) {
            const ident:Identifier = new Identifier(this.id++, this.srcStr, param.typeString, param.name, param.id);
            this.register(ident);
            args.push(ident);
        }
        const fnId:number = this.id++; 
        const contractIdent:Identifier = new Identifier(this.id++, this.srcStr, contractParam.typeString, contractParam.name, contractParam.id);
        const callAccess:MemberAccess = new MemberAccess(this.id++, this.srcStr, call.vExpression.typeString, contractIdent, def.name, fnId);
        const proxyCall:FunctionCall = new FunctionCall(this.id++, this.srcStr, call.typeString, call.kind, callAccess, args);
        var proxyStmt:Statement;
        if(rets.vParameters.length != 0) {
            proxyStmt = new Return(this.id++, this.srcStr, rets.id, proxyCall);
        }
        else {
            proxyStmt = new ExpressionStatement(this.id++, this.srcStr, proxyCall);
        }
        const body:Block = new Block(this.id++, this.srcStr, [proxyStmt]);
        const newDef:FunctionDefinition = new FunctionDefinition(fnId, this.srcStr, this.curContract.id, FunctionKind.Function, proxyName, false, FunctionVisibility.Internal, def.stateMutability, false, params, rets, [], undefined, body, undefined, undefined, undefined);
        this.register(contractType, contractParam, params, contractIdent, callAccess, proxyCall, body, newDef, proxyStmt);
        this.curContract.appendChild(newDef);
        this.contractToProxies.get(this.curContract).set(proxyName, newDef);
        return newDef;
    }

    redirectToProxy(callIdent:MemberAccess, proxyDef:FunctionDefinition, call:FunctionCall): FunctionCall {
        const contractArg:Expression = this.clone(callIdent.vExpression) as Expression;
        const callArgs:Expression[] = this.cloneList(call.vArguments) as Expression[];
        var args:Expression[] = [contractArg].concat(callArgs);
        const proxyIdent = new Identifier(this.id++, this.srcStr, call.vExpression.typeString, proxyDef.name, proxyDef.id);
        const proxyCall:FunctionCall = new FunctionCall(this.id++, this.srcStr, call.typeString, call.kind, proxyIdent, args);
        this.register(proxyIdent, proxyCall);
        return proxyCall;
    }

    process_FunctionCall(node:FunctionCall): void {
        const callIdent:Expression = node.vExpression;
        if(callIdent instanceof MemberAccess && callIdent.referencedDeclaration) {
            const oldDef:FunctionDefinition = node.context.locate(callIdent.referencedDeclaration) as FunctionDefinition;
            if(oldDef instanceof FunctionDefinition && this.info.fnParent.get(oldDef).kind != ContractKind.Library) {
                const newDef:FunctionDefinition = this.makeFnProxy(callIdent, oldDef, node);
                const proxyCall:FunctionCall = this.redirectToProxy(callIdent, newDef, node);
                this.parent.appendChild(proxyCall);
                return
            }
        }
        super.process_FunctionCall(node);
    }
}























