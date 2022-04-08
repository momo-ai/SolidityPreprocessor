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

import {
    ProjectInfo
} from "./info"


export class AstCopy extends AstTraverse<void> {

    srcStr:string;
    id:number;
    modified:SourceUnit;
    context:ASTContext;
    parent: ASTNodeWithChildren<ASTNode>;
    refRedirect:Map<number, number>;
    curContract:ContractDefinition;
    info:ProjectInfo;

    constructor() {
        super();
        this.info = undefined;
        this.srcStr = "0:0:0";
        this.id = 1;
        this.modified = new SourceUnit(0, this.srcStr, "test.sol", 0, "test.sol", new Map());
        this.context = new ASTContext(this.modified);
        this.parent = this.modified;
        this.refRedirect = new Map<number, number>();
        this.curContract = undefined;
    }

/*
 * Utility Functions
 */
    visitChildren(copyFrom:ASTNodeWithChildren<ASTNode>, copied:ASTNodeWithChildren<ASTNode>): void {
        /*if(copyFrom == undefined) {
            return;
        }*/

        const oldParent:ASTNodeWithChildren<ASTNode> = this.parent;
        this.parent = copied;
        this.walkChildren(copyFrom);
        /*for(const unit of copyFrom.children) {
            this.unitDispatch(unit);
        }*/
        this.parent = oldParent;
    }

    registerNode(oldNode:ASTNode, newNode:ASTNode) {
        if(newNode == undefined) {
            return;
        }
        
        this.context.register(newNode);
        if(oldNode != undefined) {
            this.refRedirect.set(oldNode.id, newNode.id);
        }
    }

    addNode(oldNode:ASTNode, newNode: ASTNode) {

        this.registerNode(oldNode, newNode);
        this.parent.appendChild(newNode);
    }

    cloneList(nodes: ASTNode[]): ASTNode[] {
        if(nodes == undefined) {
            return undefined;
        }

        const cloneParent:ASTNodeWithChildren<ASTNode> = new ASTNodeWithChildren<ASTNode>(this.id, this.srcStr);
        const oldParent:ASTNodeWithChildren<ASTNode> = this.parent;
        this.parent = cloneParent;
        for(const node of nodes) {
            this.unitDispatch(node);
        }

        this.parent = oldParent;
        return Array.from(cloneParent.children);
    }

    clone(node: ASTNode): ASTNode {
        if(node == undefined) {
            return undefined;
        }

        const cloneParent:ASTNodeWithChildren<ASTNode> = new ASTNodeWithChildren<ASTNode>(this.id, this.srcStr);
        const oldParent:ASTNodeWithChildren<ASTNode> = this.parent;
        this.parent = cloneParent;
        this.unitDispatch(node);
        this.parent = oldParent;
        return cloneParent.firstChild;
    }

    cloneDocs(docs: string | StructuredDocumentation): string | StructuredDocumentation {
        if(docs instanceof StructuredDocumentation) {
            return this.clone(docs) as StructuredDocumentation;
        }

        return docs;
    }

    getNewId(node:ASTNode, reqId:number):number {
        if(reqId < 0 || reqId == undefined) {
            return reqId;
        }

        if(!this.refRedirect.has(reqId)) {
            const oldParent:ASTNodeWithChildren<ASTNode> = this.parent;
            const refNode:ASTNode = node.context.locate(reqId);
            if(refNode == undefined) {
                console.log("Could not find referenced node: " + reqId);
                console.log(node);
                process.exit(1);
            } 

            if(this.info.contractOwns.has(refNode)) {
                this.parent = this.context.locate(this.getNewId(node, this.info.contractOwns.get(refNode).id)) as ContractDefinition;
            }
            else {
                this.parent = this.modified;
            }
            this.unitDispatch(refNode);
            this.parent = oldParent;
        }
        return this.refRedirect.get(reqId);
    }

/*
 * Top-level Constructs 
 */
    process_SourceUnit(node:SourceUnit): void {
        this.visitChildren(node, this.modified);
    }

    process_PragmaDirective(node:PragmaDirective): void {
        const newPragma:PragmaDirective = new PragmaDirective(this.id++, this.srcStr, node.literals);
        this.addNode(node, newPragma);
    }

    fetchContractDeps(oldDef:ContractDefinition, newDef:ContractDefinition) {
        for(const baseId of oldDef.linearizedBaseContracts.reverse()) {
            const newId:number = this.getNewId(oldDef, baseId);
            newDef.linearizedBaseContracts.unshift(newId);
        }
    }

    process_ContractDefinition(node:ContractDefinition): void {
        let baseIds:number[] = [];
        const contractId:number = this.id++;
        const newContract:ContractDefinition = new ContractDefinition(contractId, this.srcStr, node.name, this.modified.id, node.kind, node.abstract, node.fullyImplemented, baseIds, node.usedErrors, node.documentation, [], node.nameLocation);
        this.addNode(node, newContract);
        this.fetchContractDeps(node, newContract);

        const oldContract:ContractDefinition = this.curContract;
        this.curContract = newContract;
        this.visitChildren(node, newContract);
        this.curContract = oldContract;
    }

    process_ImportDirective(node:ImportDirective): void {
        this.getNewId(node, node.sourceUnit);
        //skip
    }

    process_InheritanceSpecifier(node:InheritanceSpecifier): void {
        const newBase:UserDefinedTypeName | IdentifierPath = this.clone(node.vBaseType) as UserDefinedTypeName | IdentifierPath;
        const newArgs:Expression[] = this.cloneList(node.vArguments) as Expression[];
        const newInherit:InheritanceSpecifier = new InheritanceSpecifier(this.id++, this.srcStr, newBase, newArgs);
        this.addNode(node, newInherit);
    }

    /*
     * Types
     */
    process_IdentifierPath(node:IdentifierPath): void {
        const refId:number = this.getNewId(node, node.referencedDeclaration);
        const newPath:IdentifierPath = new IdentifierPath(this.id++, this.srcStr, node.name, refId);
        this.addNode(node, newPath);
    }

    process_UserDefinedTypeName(node:UserDefinedTypeName): void {
        const refId:number = this.getNewId(node, node.referencedDeclaration);
        const newPath:IdentifierPath = this.clone(node.path) as IdentifierPath;
        const newType:UserDefinedTypeName = new UserDefinedTypeName(this.id++, this.srcStr, node.typeString, node.name, refId, newPath);
        this.addNode(node, newType);
    }

    process_ElementaryTypeName(node:ElementaryTypeName): void {
        const newType:ElementaryTypeName = new ElementaryTypeName(this.id++, this.srcStr, node.typeString, node.name, node.stateMutability);
        this.addNode(node, newType);
    }

    process_ArrayTypeName(node:ArrayTypeName): void {
        const newType:TypeName = this.clone(node.vBaseType) as TypeName;
        const newLen:Expression = this.clone(node.vLength) as Expression;
        const newArr:ArrayTypeName = new ArrayTypeName(this.id++, this.srcStr, node.typeString, newType, newLen);
        this.addNode(node, newArr);
    }

    process_Mapping(node:Mapping): void {
        const newKey:TypeName = this.clone(node.vKeyType) as TypeName;
        const newVal:TypeName = this.clone(node.vValueType) as TypeName;
        const newMap:Mapping = new Mapping(this.id++, this.srcStr, node.typeString, newKey, newVal);
        this.addNode(node, newMap);
    }

    process_FunctionTypeName(node:FunctionTypeName): void {
        const newParams:ParameterList = this.clone(node.vParameterTypes) as ParameterList;
        const newRets:ParameterList = this.clone(node.vReturnParameterTypes) as ParameterList;
        const newType:FunctionTypeName = new FunctionTypeName(this.id++, this.srcStr, node.typeString, node.visibility, node.stateMutability, newParams, newRets);
        this.addNode(node, newType);
    }

    /*
     * Contracts
     */

    process_UsingForDirective(node:UsingForDirective): void {
        const newLib:UserDefinedTypeName | IdentifierPath = this.clone(node.vLibraryName) as UserDefinedTypeName | IdentifierPath;
        const newType:TypeName = this.clone(node.vTypeName) as TypeName;
        const newFnList:IdentifierPath[] = this.cloneList(node.vFunctionList) as IdentifierPath[];
        const newUsing:UsingForDirective = new UsingForDirective(this.id++, this.srcStr, node.isGlobal, newLib, newFnList, newType);
        this.addNode(node, newUsing);
    }

    process_StructDefinition(node:StructDefinition): void {
        const newStruct:StructDefinition = new StructDefinition(this.id++, this.srcStr, node.name, node.scope, node.visibility, [], node.nameLocation);
        this.addNode(node, newStruct);
        this.visitChildren(node, newStruct);
    }

    process_VariableDeclaration(node:VariableDeclaration): void {
        const newType:TypeName = this.clone(node.vType) as TypeName;
        const newOverride:OverrideSpecifier = this.clone(node.vOverrideSpecifier) as OverrideSpecifier;
        const newValue:Expression = this.clone(node.vValue) as Expression;
        const newVariable:VariableDeclaration = new VariableDeclaration(this.id++, this.srcStr, node.constant, node.indexed, node.name, node.scope, node.stateVariable, node.storageLocation, node.visibility, node.mutability, node.typeString, node.documentation, newType, newOverride, newValue, node.nameLocation);
        this.addNode(node, newVariable);
    }

    process_UserDefinedValueTypeDefinition(node:UserDefinedValueTypeDefinition): void {
        const elemType:ElementaryTypeName = this.clone(node.underlyingType) as ElementaryTypeName;
        const newType:UserDefinedValueTypeDefinition = new UserDefinedValueTypeDefinition(this.id++, this.srcStr, node.name, elemType, node.nameLocation);

        this.addNode(node, newType);
    }

    process_EnumDefinition(node:EnumDefinition): void {
        const newEnum:EnumDefinition = new EnumDefinition(this.id++, this.srcStr, node.name, [], node.nameLocation);
        this.addNode(node, newEnum);
        this.visitChildren(node, newEnum);
    }

    process_EnumValue(node:EnumValue): void {
        const newVal:EnumValue = new EnumValue(this.id++, this.srcStr, node.name, node.nameLocation);
        this.addNode(node, newVal);
    }

    process_ErrorDefinition(node:ErrorDefinition): void {
        const newParams:ParameterList = this.clone(node.vParameters) as ParameterList;
        const newErr:ErrorDefinition = new ErrorDefinition(this.id++, this.srcStr, node.name, newParams, node.documentation, node.nameLocation);
        this.addNode(node, newErr);
    }

    process_EventDefinition(node:EventDefinition): void {
        const newParams:ParameterList = this.clone(node.vParameters) as ParameterList;
        const newEvent:EventDefinition = new EventDefinition(this.id++, this.srcStr, node.anonymous, node.name, newParams, node.documentation, node.nameLocation);
        this.addNode(node, newEvent);
    }

    process_StructuredDocumentation(node:StructuredDocumentation): void {
        const newDoc:StructuredDocumentation = new StructuredDocumentation(this.id++, this.srcStr, node.text);
        this.addNode(node, newDoc);
    }

    process_ModifierDefinition(node:ModifierDefinition): void {
        const newParams:ParameterList = this.clone(node.vParameters) as ParameterList;
        const newBody:Block = this.clone(node.vBody) as Block;
        const newOverride:OverrideSpecifier = this.clone(node.vOverrideSpecifier) as OverrideSpecifier;
        const newMod:ModifierDefinition = new ModifierDefinition(this.id++, this.srcStr, node.name, node.virtual, node.visibility, newParams, newOverride, newBody, node.documentation, node.nameLocation);
        this.addNode(node, newMod);
    }

    process_OverrideSpecifier(node:OverrideSpecifier): void {
        const newOverride:OverrideSpecifier = new OverrideSpecifier(this.id++, this.srcStr, []);
        this.addNode(node, newOverride);
        this.visitChildren(node, newOverride);
    }

    process_ModifierInvocation(node:ModifierInvocation): void {
        const newIdent:Identifier | IdentifierPath = this.clone(node.vModifierName) as Identifier | IdentifierPath;
        const newArgs:Expression[] = this.cloneList(node.vArguments) as Expression[];
        const newInv:ModifierInvocation = new ModifierInvocation(this.id++, this.srcStr, newIdent, newArgs, node.kind);
        this.addNode(node, newInv);
    }

    process_FunctionDefinition(node:FunctionDefinition): void {
        const newParams:ParameterList = this.clone(node.vParameters) as ParameterList;
        const newRets:ParameterList = this.clone(node.vReturnParameters) as ParameterList;
        const newBody:Block = this.clone(node.vBody) as Block;
        const newOverride:OverrideSpecifier = this.clone(node.vOverrideSpecifier) as OverrideSpecifier;
        const mods:ModifierInvocation[] = this.cloneList(node.vModifiers) as ModifierInvocation[];
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newFn:FunctionDefinition = new FunctionDefinition(this.id++, this.srcStr, node.scope, node.kind, node.name, node.virtual, node.visibility, node.stateMutability, node.isConstructor, newParams, newRets, mods, newOverride, newBody, docs, node.nameLocation);

        this.addNode(node, newFn);
    }

    /*
     * Functions
     */
    process_ParameterList(node:ParameterList): void {
        const newParams:ParameterList = new ParameterList(this.id++, this.srcStr, []);
        this.addNode(node, newParams);
        this.visitChildren(node, newParams);
    }

    process_Block(node:Block): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newBlk:Block = new Block(this.id++, this.srcStr, [], docs);
        this.addNode(node, newBlk);
        this.visitChildren(node, newBlk);
    }

    process_UncheckedBlock(node:UncheckedBlock): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newBlk:UncheckedBlock = new UncheckedBlock(this.id++, this.srcStr, [], docs);
        this.addNode(node, newBlk);
        this.visitChildren(node, newBlk);
    }

    process_IfStatement(node:IfStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCond:Expression = this.clone(node.vCondition) as Expression;
        const newTrue:Statement = this.clone(node.vTrueBody) as Statement;
        const newFalse:Statement = this.clone(node.vFalseBody) as Statement;
        const newIf:IfStatement = new IfStatement(this.id++, this.srcStr, newCond, newTrue, newFalse, docs);
        this.addNode(node, newIf);
    }

    process_WhileStatement(node:WhileStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCond:Expression = this.clone(node.vCondition) as Expression;
        const newBody:Statement = this.clone(node.vBody) as Statement;
        const newWhile:WhileStatement = new WhileStatement(this.id++, this.srcStr, newCond, newBody, docs);
        this.addNode(node, newWhile);
    }

    process_DoWhileStatement(node:DoWhileStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCond:Expression = this.clone(node.vCondition) as Expression;
        const newBody:Statement = this.clone(node.vBody) as Statement;
        const newWhile:DoWhileStatement = new DoWhileStatement(this.id++, this.srcStr, newCond, newBody, docs);
        this.addNode(node, newWhile);
    }

    process_ForStatement(node:ForStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newInit:VariableDeclarationStatement | ExpressionStatement = this.clone(node.vInitializationExpression) as VariableDeclarationStatement | ExpressionStatement;
        const newCond:Expression = this.clone(node.vCondition) as Expression;
        const newLoopExpr:ExpressionStatement = this.clone(node.vLoopExpression) as ExpressionStatement;
        const newBody:Statement = this.clone(node.vBody) as Statement;
        const newFor:ForStatement = new ForStatement(this.id++, this.srcStr, newBody, newInit, newCond, newLoopExpr, docs);
        this.addNode(node, newFor);
    }


    process_ExpressionStatement(node:ExpressionStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newExpr:Expression = this.clone(node.vExpression) as Expression;
        const newStmt:ExpressionStatement = new ExpressionStatement(this.id++, this.srcStr, newExpr, docs);
        this.addNode(node, newStmt);
    }

    process_VariableDeclarationStatement(node:VariableDeclarationStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newDecls:VariableDeclaration[] = this.cloneList(node.vDeclarations) as VariableDeclaration[];
        const newVal:Expression = this.clone(node.vInitialValue) as Expression;
        var assign:Array<number | null> = []
        for(const declId of node.assignments) {
            if(declId == null) {
                assign.push(null);
            }
            else {
                assign.push(this.getNewId(node, declId));
            }
        }

        const newStmt:VariableDeclarationStatement = new VariableDeclarationStatement(this.id++, this.srcStr, assign, newDecls, newVal, docs);
        this.addNode(node, newStmt)
    }

    process_EmitStatement(node:EmitStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCall:FunctionCall = this.clone(node.vEventCall) as FunctionCall;
        const newEmit:EmitStatement = new EmitStatement(this.id++, this.srcStr, newCall, docs);
        this.addNode(node, newEmit);
    }

    process_Return(node:Return): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newExpr:Expression = this.clone(node.vExpression) as Expression;
        const newRet:Return = new Return(this.id++, this.srcStr, node.functionReturnParameters, newExpr, docs);
        this.addNode(node, newRet);
    }

    process_Continue(node:Continue): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCont:Continue = new Continue(this.id++, this.srcStr, docs);
        this.addNode(node, newCont);
    }

    process_Break(node:Break): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newBreak:Break = new Break(this.id++, this.srcStr, docs);
        this.addNode(node, newBreak);
    }

    process_Throw(node:Throw): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newThrow:Throw = new Throw(this.id++, this.srcStr, docs);
        this.addNode(node, newThrow);
    }

    process_PlaceholderStatement(node:PlaceholderStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newStmt:PlaceholderStatement = new PlaceholderStatement(this.id++, this.srcStr, docs);
        this.addNode(node, newStmt);
    }

    process_RevertStatement(node:RevertStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCall:FunctionCall = this.clone(node.errorCall) as FunctionCall;
        const newRevert:RevertStatement = new RevertStatement(this.id++, this.srcStr, newCall, docs);
        this.addNode(node, newRevert);
    }

    process_TryCatchClause(node:TryCatchClause): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newParams:ParameterList = this.clone(node.vParameters) as ParameterList;
        const newBlk:Block = this.clone(node.vBlock) as Block;
        const newCatch:TryCatchClause = new TryCatchClause(this.id++, this.srcStr, node.errorName, newBlk, newParams, docs);
        this.addNode(node, newCatch);
    }

    process_TryStatement(node:TryStatement): void {
        const docs:string | StructuredDocumentation = this.cloneDocs(node.documentation);
        const newCall:FunctionCall = this.clone(node.vExternalCall) as FunctionCall;
        const newClause:TryCatchClause[] = this.cloneList(node.vClauses) as TryCatchClause[];
        const newTry:TryStatement = new TryStatement(this.id++, this.srcStr, newCall, newClause, docs);
        this.addNode(node, newTry);
    }

    /*
     * Expressions
     */
    process_Assignment(node:Assignment): void {
        const newLhs:Expression = this.clone(node.vLeftHandSide) as Expression;
        const newRhs:Expression = this.clone(node.vRightHandSide) as Expression;
        const newAssign:Assignment = new Assignment(this.id++, this.srcStr, node.typeString, node.operator, newLhs, newRhs);
        this.addNode(node, newAssign);
    }

    process_BinaryOperation(node:BinaryOperation): void {
        const newLhs:Expression = this.clone(node.vLeftExpression) as Expression;
        const newRhs:Expression = this.clone(node.vRightExpression) as Expression;
        const newBop:BinaryOperation = new BinaryOperation(this.id++, this.srcStr, node.typeString, node.operator, newLhs, newRhs);
        this.addNode(node, newBop);
    }

    process_UnaryOperation(node:UnaryOperation): void {
        const newExpr:Expression = this.clone(node.vSubExpression) as Expression;
        const newUop:UnaryOperation = new UnaryOperation(this.id++, this.srcStr, node.typeString, node.prefix, node.operator, newExpr);
        this.addNode(node, newUop);
    }

    process_MemberAccess(node:MemberAccess): void {
        const refId:number = this.getNewId(node, node.referencedDeclaration);
        const newExpr:Expression = this.clone(node.vExpression) as Expression;
        const newAccess:MemberAccess = new MemberAccess(this.id++, this.srcStr, node.typeString, newExpr, node.memberName, refId);
        this.addNode(node, newAccess);
    }

    process_IndexAccess(node:IndexAccess): void {
        const newBaseExpr:Expression = this.clone(node.vBaseExpression) as Expression;
        const newIndexExpr:Expression = this.clone(node.vIndexExpression) as Expression;
        const newAccess:IndexAccess = new IndexAccess(this.id++, this.srcStr, node.typeString, newBaseExpr, newIndexExpr);
        this.addNode(node, newAccess);
    }

    process_IndexRangeAccess(node:IndexRangeAccess): void {
        const newBaseExpr:Expression = this.clone(node.vBaseExpression) as Expression;
        const newStartExpr:Expression = this.clone(node.vStartExpression) as Expression;
        const newEndExpr:Expression = this.clone(node.vEndExpression) as Expression;
        const newAccess:IndexRangeAccess = new IndexRangeAccess(this.id++, this.srcStr, node.typeString, newBaseExpr, newStartExpr, newEndExpr);
        this.addNode(node, newAccess);
    }

    process_NewExpression(node:NewExpression): void {
        const newType:TypeName = this.clone(node.vTypeName) as TypeName;
        const newNew:NewExpression = new NewExpression(this.id++, this.srcStr, node.typeString, newType);
        this.addNode(node, newNew);
    }

    process_Identifier(node:Identifier): void {
        const refId:number = this.getNewId(node, node.referencedDeclaration);
        const newIdent:Identifier = new Identifier(this.id++, this.srcStr, node.typeString, node.name, refId);
        this.addNode(node, newIdent);
    }

    process_FunctionCall(node:FunctionCall): void {
        const newExpr:Expression = this.clone(node.vExpression) as Expression;
        const newArgs:Expression[] = this.cloneList(node.vArguments) as Expression[];
        const newCall:FunctionCall = new FunctionCall(this.id++, this.srcStr, node.typeString, node.kind, newExpr, newArgs, node.fieldNames);
        this.addNode(node, newCall);
    }

    process_Literal(node:Literal): void {
        const newLiteral:Literal = new Literal(this.id++, this.srcStr, node.typeString, node.kind, node.hexValue, node.value, node.subdenomination);
        this.addNode(node, newLiteral);
    }

    process_TupleExpression(node:TupleExpression): void {
        let newComps:Array<Expression | null> = new Array<Expression | null>();
        for(const component of node.vOriginalComponents) {
            newComps.push(this.clone(component) as Expression | null);
        }

        const newExpr:TupleExpression = new TupleExpression(this.id++, this.srcStr, node.typeString, node.isInlineArray, newComps);
        this.addNode(node, newExpr);
    }

    process_ElementaryTypeNameExpression(node:ElementaryTypeNameExpression): void {
        let newName:string | ElementaryTypeName = node.typeName;
        if(newName instanceof ElementaryTypeName) {
            newName = this.clone(newName) as ElementaryTypeName;
        }
        const newExpr:ElementaryTypeNameExpression = new ElementaryTypeNameExpression(this.id++, this.srcStr, node.typeString, newName);
        this.addNode(node, newExpr);
    }

    process_Conditional(node:Conditional): void {
        const newCond:Expression = this.clone(node.vCondition) as Expression;
        const newTrue:Expression = this.clone(node.vTrueExpression) as Expression;
        const newFalse:Expression = this.clone(node.vFalseExpression) as Expression;
        const newExpr:Conditional = new Conditional(this.id++, this.srcStr, node.typeString, newCond, newTrue, newFalse);
        this.addNode(node, newExpr);
    }

    process_FunctionCallOptions(node:FunctionCallOptions): void {
        const newExpr:Expression = this.clone(node.vExpression) as Expression;
        let newOptions:Map<string, Expression> = new Map<string, Expression>();
        for(const entry of node.vOptionsMap.entries()) {
            newOptions.set(entry[0], this.clone(entry[1]) as Expression);
        }
        const newFnCallOp = new FunctionCallOptions(this.id++, this.srcStr, node.typeString, newExpr, newOptions);
        this.addNode(node, newFnCallOp);
    }

    unitDispatch(node:ASTNode): void {
        if(this.refRedirect.has(node.id)) {
            if(this.parent.children.find(n => n.id == this.refRedirect.get(node.id))) {
                return;
            }
            this.parent.appendChild(this.context.locate(this.getNewId(node, node.id)));
            return;
        }

        super.unitDispatch(node);
    }

    preprocess(units: SourceUnit[]):SourceUnit {
        this.info = new ProjectInfo();
        this.info.preprocess(units);
        for(const unit of units) {
            this.unitDispatch(unit);
        }

        return this.modified;
    }
}
