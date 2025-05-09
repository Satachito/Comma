import {
	OperatorC
,	OpenParen
,	CloseParen
,	OpenString
,	Tokenize
} from './Tokenize.js'

const
IsReserved	= _ => [
	`await`
,	`break`
,	`case`
,	`catch`
,	`class`
,	`const`
,	`continue`
,	`debugger`
,	`default`
,	`delete`
,	`do`
,	`else`
,	`enum`
,	`export`
,	`extends`
,	`false`
,	`finally`
,	`for`
,	`function`
,	`if`
,	`import`
,	`in`
,	`instanceof`
,	`new`
,	`null`
,	`return`
,	`super`
,	`switch`
,	`this`
,	`throw`
,	`true`
,	`try`
,	`typeof`
,	`var`
,	`void`
,	`while`
,	`with`
,	`yield`
,	`implements`
,	`interface`
,	`let`
,	`package`
,	`private`
,	`protected`
,	`public`
,	`static`
,	`true`
,	`false`
,	`null`
,	`NaN`
,	`Infinity`
,	`undefined`
,	`globalThis`
,	`arguments`
].includes( _ )

const
IsOperator	= _ => [
	`!`
,	`~`
,	`...`

,	`++`
,	`--`

,	`+`
,	`-`

,	`*`
,	`/`
,	`%`
,	`=`
,	`>`
,	`<`
,	`&`
,	`|`
,	`^`

,	`**`
,	`+=`
,	`-=`
,	`*=`
,	`/=`
,	`%=`
,	`**=`
,	`==`
,	`!=`
,	`===`
,	`!==`
,	`>=`
,	`<=`
,	`&&`
,	`||`
,	`??`
,	`<<`
,	`>>`
,	`>>>`
,	`?`
,	`:`
,	`?.`

,	`.`
].includes( _ )

const
IsRegEX		= _ => _.at( 0 ) === '/' && _.at( -1 ) === '/'

const
IsString	= _ => OpenString.includes( _.at( 0 ) )

const
CLV			= _ => _ === 'const' || _ === 'let' || _ === 'var'

const
IFW			= _ => _ === 'if' || _ === 'while' || _ === 'for'

const
CorrParen	= _ => (
	{	'(':	')'
	,	'{':	'}'
	,	'[':	']'
	}[ _ ]
)

const
MakeTrees	= Ts => {
	let _ = 0

	const
	Trees = ( closer = null ) => {
		const
		$ = []
		let	
		body = []

		while ( _ < Ts.length ) {

			const T = Ts[ _++ ]
			if( T === closer ) break

			OpenParen.includes( T ) ?(
				$.push( { body, open: T, subTrees: Trees( CorrParen( T ) ) } )
			,	body = []
			) :	T === ',' ?(
				body.length && $.push( body )
			,	body = [ T ]
			) :	T === ';' ?(
				$.push( [ ...body, T ] )
			,	body = []
			) :	T === '\n' ?(
				$.push( body )
			,	body = []
			) :	body.push( T )
		}
		body.length && $.push( body )
		return $
	}
	return Trees()
}

const
Lines = trees => {

	let
	$ = []

	const
	Head = _ => _ === '' || _ === ',' || _ === ',\t' || _.endsWith( '.' )

	const
	Append = ( _, separator = ' ' ) => $.length
	?	$[ $.length - 1 ] += Head( $.at( -1 ) ) ? _ : ( separator + _ )
	:	$.push( _ )

	const
	Make = _ => _.length
	?	_[ 0 ] === ','
		?	',\t' + Make( _.slice( 1 ) )
		:	_[ 0 ] === '.'
			?	'.' + Make( _.slice( 1 ) )
			:	_[ 0 ] + ' ' + Make( _.slice( 1 ) )
	:	''

	for ( const tree of trees ) {
		if ( Array.isArray( tree ) ) {
			if ( tree.length ) {
				if ( CLV( tree[ 0 ] ) ) {
					$.push( tree[ 0 ] )
					$.push( Make( tree.slice( 1 ) ) )
				} else {
					$.length && CloseParen.includes( $.at( -1 ).at( -1 ) )
					?	Append( Make( tree ) )
					:	$.push( Make( tree ) )
				}
			}
		} else {
			const
			{ body, open, subTrees } = tree
			const
			close = CorrParen( open )

			Append( Make( body ) + open )

			const
			lines = Lines( subTrees )

			lines.length == 0
			?	Append( close, '' )
			:	lines.length == 1
				?	Append( lines[ 0 ] + ' ' + close )
				:	(	lines.forEach(
							line => {
								const
								indented = line.length > 1 && line[ 0 ] === ',' && line[ 1 ] === '\t'
								?	line
								:	'\t' + line

								const
								last = $.at( -1 )
								last.length === 1 && OpenParen.includes( last[ 0 ] )
								?	Append( indented )
								:	$.push( indented )
							}
						)
					,	$.push( close )
					)
		}
	}
	return $
}

const
Make = _ => Lines( MakeTrees( Tokenize( _ ) ) ).join( '\n' )
/*
const
S = _ => JSON.stringify( _, null, '\t' )
const
Make = _ => S( MakeTrees( Tokenize( _ ) ) )
*/

import fs from 'fs'

fs.writeFileSync(
	'/dev/stdout'
,	Make( fs.readFileSync( '/dev/stdin', 'utf8' ) )
)

