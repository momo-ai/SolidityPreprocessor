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


export class AstTraverse<RetType> {

    /*
     * Top-level Constructs 
     */
    process_SourceUnit(node:SourceUnit): RetType { return this.process_Default(node); }

    process_PragmaDirective(node:PragmaDirective): RetType { return this.process_Default(node); }

    process_ContractDefinition(node:ContractDefinition): RetType { return this.process_Default(node); }

    process_ImportDirective(node:ImportDirective): RetType { return this.process_Default(node); }

    process_InheritanceSpecifier(node:InheritanceSpecifier): RetType { return this.process_Default(node); }

    /*
     * Types
     */
    process_IdentifierPath(node:IdentifierPath): RetType { return this.process_Default(node); }

    process_UserDefinedTypeName(node:UserDefinedTypeName): RetType { return this.process_Default(node); }

    process_ElementaryTypeName(node:ElementaryTypeName): RetType { return this.process_Default(node); }

    process_ArrayTypeName(node:ArrayTypeName): RetType { return this.process_Default(node); }

    process_Mapping(node:Mapping): RetType { return this.process_Default(node); }

    process_FunctionTypeName(node:FunctionTypeName): RetType { return this.process_Default(node); }

    /*
     * Contracts
     */
    process_UsingForDirective(node:UsingForDirective): RetType { return this.process_Default(node); }

    process_StructDefinition(node:StructDefinition): RetType { return this.process_Default(node); }

    process_VariableDeclaration(node:VariableDeclaration): RetType { return this.process_Default(node); }

    process_UserDefinedValueTypeDefinition(node:UserDefinedValueTypeDefinition): RetType { return this.process_Default(node); }

    process_EnumDefinition(node:EnumDefinition): RetType { return this.process_Default(node); }

    process_EnumValue(node:EnumValue): RetType { return this.process_Default(node); }

    process_ErrorDefinition(node:ErrorDefinition): RetType { return this.process_Default(node); }

    process_EventDefinition(node:EventDefinition): RetType { return this.process_Default(node); }

    process_StructuredDocumentation(node:StructuredDocumentation): RetType { return this.process_Default(node); }

    process_ModifierDefinition(node:ModifierDefinition): RetType { return this.process_Default(node); }

    process_OverrideSpecifier(node:OverrideSpecifier): RetType { return this.process_Default(node); }

    process_ModifierInvocation(node:ModifierInvocation): RetType { return this.process_Default(node); }

    process_FunctionDefinition(node:FunctionDefinition): RetType { return this.process_Default(node); }

    /*
     * Functions
     */
    process_ParameterList(node:ParameterList): RetType { return this.process_Default(node); }

    process_Block(node:Block): RetType { return this.process_Default(node); }

    process_UncheckedBlock(node:UncheckedBlock): RetType { return this.process_Default(node); }

    process_IfStatement(node:IfStatement): RetType { return this.process_Default(node); }

    process_WhileStatement(node:WhileStatement): RetType { return this.process_Default(node); }

    process_DoWhileStatement(node:DoWhileStatement): RetType { return this.process_Default(node); }

    process_ForStatement(node:ForStatement): RetType { return this.process_Default(node); }


    process_ExpressionStatement(node:ExpressionStatement): RetType { return this.process_Default(node); }

    process_VariableDeclarationStatement(node:VariableDeclarationStatement): RetType { return this.process_Default(node); }

    process_EmitStatement(node:EmitStatement): RetType { return this.process_Default(node); }

    process_Return(node:Return): RetType { return this.process_Default(node); }

    process_Continue(node:Continue): RetType { return this.process_Default(node); }

    process_Break(node:Break): RetType { return this.process_Default(node); }

    process_Throw(node:Throw): RetType { return this.process_Default(node); }

    process_PlaceholderStatement(node:PlaceholderStatement): RetType { return this.process_Default(node); }

    process_RevertStatement(node:RevertStatement): RetType { return this.process_Default(node); }

    process_TryCatchClause(node:TryCatchClause): RetType { return this.process_Default(node); }

    process_TryStatement(node:TryStatement): RetType { return this.process_Default(node); }

    /*
     * Expressions
     */

    process_Assignment(node:Assignment): RetType { return this.process_Default(node); }

    process_BinaryOperation(node:BinaryOperation): RetType { return this.process_Default(node); }

    process_UnaryOperation(node:UnaryOperation): RetType { return this.process_Default(node); }

    process_MemberAccess(node:MemberAccess): RetType { return this.process_Default(node); }

    process_IndexAccess(node:IndexAccess): RetType { return this.process_Default(node); }

    process_IndexRangeAccess(node:IndexRangeAccess): RetType { return this.process_Default(node); }

    process_NewExpression(node:NewExpression): RetType { return this.process_Default(node); }

    process_Identifier(node:Identifier): RetType { return this.process_Default(node); }

    process_FunctionCall(node:FunctionCall): RetType { return this.process_Default(node); }

    process_Literal(node:Literal): RetType { return this.process_Default(node); }

    process_TupleExpression(node:TupleExpression): RetType { return this.process_Default(node); }

    process_ElementaryTypeNameExpression(node:ElementaryTypeNameExpression): RetType { return this.process_Default(node); }

    process_Conditional(node:Conditional): RetType { return this.process_Default(node); }

    process_FunctionCallOptions(node:FunctionCallOptions): RetType { return this.process_Default(node); }

    process_Default(node:ASTNode): RetType { return undefined; }

    walkChildren(node:ASTNodeWithChildren<ASTNode>): RetType[] {
        if(node == undefined) {
            return;
        }   

        let result:RetType[] = [];
        for(const unit of node.children) {
            const res:RetType = this.unitDispatch(unit);
            if(res != undefined) {
                result.push(res);
            }
        }   

        return result;
    } 

    unitDispatch(node:ASTNode): RetType {
        if(node instanceof PragmaDirective) {
            return this.process_PragmaDirective(node);
        }
        else if(node instanceof EnumValue) {
            return this.process_EnumValue(node);
        }
        else if(node instanceof EnumDefinition) {
            return this.process_EnumDefinition(node);
        }
        else if(node instanceof IdentifierPath) {
            return this.process_IdentifierPath(node);
        }
        else if(node instanceof UserDefinedTypeName) {
            return this.process_UserDefinedTypeName(node);
        }
        else if(node instanceof VariableDeclaration) {
            return this.process_VariableDeclaration(node);
        }
        else if(node instanceof ElementaryTypeName) {
            return this.process_ElementaryTypeName(node);
        }
        else if(node instanceof SourceUnit) {
            return this.process_SourceUnit(node);
        }
        else if(node instanceof ContractDefinition) {
            return this.process_ContractDefinition(node);
        }
        else if(node instanceof ModifierDefinition) {
            return this.process_ModifierDefinition(node);
        }
        else if(node instanceof FunctionDefinition) {
            return this.process_FunctionDefinition(node);
        }
        else if(node instanceof EventDefinition) {
            return this.process_EventDefinition(node);
        }
        else if(node instanceof Block) {
            return this.process_Block(node);
        }
        else if(node instanceof IfStatement) {
            return this.process_IfStatement(node);
        }
        else if(node instanceof ExpressionStatement) {
            return this.process_ExpressionStatement(node);
        }
        else if(node instanceof Assignment) {
            return this.process_Assignment(node);
        }
        else if(node instanceof BinaryOperation) {
            return this.process_BinaryOperation(node);
        }
        else if(node instanceof MemberAccess) {
            return this.process_MemberAccess(node);
        }
        else if(node instanceof Identifier) {
            return this.process_Identifier(node);
        }
        else if(node instanceof FunctionCall) {
            return this.process_FunctionCall(node);
        }
        else if(node instanceof Literal) {
            return this.process_Literal(node);
        }
        else if(node instanceof ParameterList) {
            return this.process_ParameterList(node);
        }
        else if(node instanceof Return) {
            return this.process_Return(node);
        }
        else if(node instanceof StructDefinition) {
            return this.process_StructDefinition(node);
        }
        else if(node instanceof DoWhileStatement) {
            return this.process_DoWhileStatement(node);
        }
        else if(node instanceof UnaryOperation) {
            return this.process_UnaryOperation(node);
        }
        else if(node instanceof StructuredDocumentation) {
            return this.process_StructuredDocumentation(node);
        }
        else if(node instanceof ForStatement) {
            return this.process_ForStatement(node);
        }
        else if(node instanceof WhileStatement) {
            return this.process_WhileStatement(node);
        }
        else if(node instanceof TupleExpression) {
            return this.process_TupleExpression(node);
        }
        else if(node instanceof VariableDeclarationStatement) {
            return this.process_VariableDeclarationStatement(node);
        }
        else if(node instanceof ElementaryTypeNameExpression) {
            return this.process_ElementaryTypeNameExpression(node);
        }
        else if(node instanceof UserDefinedValueTypeDefinition) {
            return this.process_UserDefinedValueTypeDefinition(node);
        }
        else if(node instanceof ErrorDefinition) {
            return this.process_ErrorDefinition(node);
        }
        else if(node instanceof ModifierInvocation) {
            return this.process_ModifierInvocation(node);
        }
        else if(node instanceof OverrideSpecifier) {
            return this.process_OverrideSpecifier(node);
        }
        else if(node instanceof Conditional) {
            return this.process_Conditional(node);
        }
        else if(node instanceof NewExpression) {
            return this.process_NewExpression(node);
        }
        else if(node instanceof IndexAccess) {
            return this.process_IndexAccess(node);
        }
        else if(node instanceof IndexRangeAccess) {
            return this.process_IndexRangeAccess(node);
        }
        else if(node instanceof Conditional) {
            return this.process_Conditional(node);
        }
        else if(node instanceof FunctionCallOptions) {
            return this.process_FunctionCallOptions(node);
        }
        else if(node instanceof UncheckedBlock) {
            return this.process_UncheckedBlock(node);
        }
        else if(node instanceof EmitStatement) {
            return this.process_EmitStatement(node);
        }
        else if(node instanceof Continue) {
            return this.process_Continue(node);
        }
        else if(node instanceof Break) {
            return this.process_Break(node);
        }
        else if(node instanceof Throw) {
            return this.process_Throw(node);
        }
        else if(node instanceof PlaceholderStatement) {
            return this.process_PlaceholderStatement(node);
        }
        else if(node instanceof RevertStatement) {
            return this.process_RevertStatement(node);
        }
        else if(node instanceof TryCatchClause) {
            return this.process_TryCatchClause(node);
        }
        else if(node instanceof TryStatement) {
            return this.process_TryStatement(node);
        }
        else if(node instanceof ArrayTypeName) {
            return this.process_ArrayTypeName(node);
        }
        else if(node instanceof Mapping) {
            return this.process_Mapping(node);
        }
        else if(node instanceof ImportDirective) {
            return this.process_ImportDirective(node);
        }
        else if(node instanceof InheritanceSpecifier) {
            return this.process_InheritanceSpecifier(node);
        }
        else if(node instanceof UsingForDirective) {
            return this.process_UsingForDirective(node);
        }
        else {
            console.log("Unknown type");
            console.log(node);
            process.exit(1);
        }

        return undefined;
    }

    preprocess(units: SourceUnit[]):SourceUnit {
        for(const unit of units) {
            this.unitDispatch(unit);
        }

        return undefined;
    }
}
