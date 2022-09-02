#!/usr/bin/env node

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
} from "solc-typed-ast";

import {AstCopy}  from "./copy";
import {DSLGen} from "./dslGen";
import {Summarizer} from "./summarize";


async function readAST(
    fileName: string,
): Promise<SourceUnit[]> {
    const reader = new ASTReader();

    const result = await compileSol(fileName, "auto", { basePath: "./"}, undefined, undefined, undefined)

    return reader.read(result.data);
}

function writeAST(units: SourceUnit[], version: string): [string, Map<ASTNode, [number, number]>] {
    const formatter = new PrettyFormatter(4, 0);
    const writer = new ASTWriter(DefaultASTWriterMapping, formatter, version);
    const sourceMap = new Map<ASTNode, [number, number]>();
    for (const unit of units) {
        console.log(writer.write(unit));
    }


    return [units.map((unit) => writer.write(unit, sourceMap)).join("\n"), sourceMap];
}

async function test(filename: string) {
    const ast : SourceUnit[] = await readAST(filename);
    const summarizer:Summarizer = new Summarizer();
    summarizer.preprocess(ast);
    //const result: CompileResult = await compile(filename);
    //const reader = new ASTReader();
    //const sourceUnits = reader.read(result.data);
    //console.log(result);
}

test(process.argv[2]);

