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
} from "./traverse"


export class ProjectInfo extends AstTraverse<void> {

    curContract:ContractDefinition;
    contractOwns:Map<ASTNode, ContractDefinition>
    structParent:Map<StructDefinition, ContractDefinition>;
    stateVarParent:Map<VariableDeclaration, ContractDefinition>;
    enumParent:Map<EnumDefinition, ContractDefinition>;
    errorParent:Map<ErrorDefinition, ContractDefinition>;
    eventParent:Map<EventDefinition, ContractDefinition>;
    modifierParent:Map<ModifierDefinition, ContractDefinition>;
    fnParent:Map<FunctionDefinition, ContractDefinition>;

    constructor() {
        super();
        this.curContract = undefined;
        this.contractOwns = new Map<ASTNode, ContractDefinition>();
        this.structParent = new Map<StructDefinition, ContractDefinition>();
        this.stateVarParent = new Map<VariableDeclaration, ContractDefinition>();
        this.enumParent = new Map<EnumDefinition, ContractDefinition>();
        this.errorParent = new Map<ErrorDefinition, ContractDefinition>();
        this.eventParent = new Map<EventDefinition, ContractDefinition>();
        this.modifierParent = new Map<ModifierDefinition, ContractDefinition>();
        this.fnParent = new Map<FunctionDefinition, ContractDefinition>();
    }

    /*
     * Top-level Constructs 
     */
    process_SourceUnit(node:SourceUnit): void { 
        this.walkChildren(node);
    }


    process_ContractDefinition(node:ContractDefinition): void { 
        this.curContract = node;
        for(const child of node.children) {
            this.contractOwns.set(child, node);
        }
        this.walkChildren(node);
        this.curContract = undefined;
    }


    process_UsingForDirective(node:UsingForDirective): void { 
    }

    process_StructDefinition(node:StructDefinition): void { 
        this.structParent.set(node, this.curContract);
    }

    process_VariableDeclaration(node:VariableDeclaration): void {
        this.stateVarParent.set(node, this.curContract);
    }

    process_EnumDefinition(node:EnumDefinition): void {
        this.enumParent.set(node, this.curContract);
    }

    process_ErrorDefinition(node:ErrorDefinition): void {
        this.errorParent.set(node, this.curContract);
    }

    process_EventDefinition(node:EventDefinition): void {
        this.eventParent.set(node, this.curContract);
    }

    process_ModifierDefinition(node:ModifierDefinition): void {
        this.modifierParent.set(node, this.curContract);
    }

    process_FunctionDefinition(node:FunctionDefinition): void {
        this.fnParent.set(node, this.curContract);
    }

}
