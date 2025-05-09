import {
	OperatorC
,	OpenParen
,	CloseParen
,	OpenString
,	Tokenize
} from './Tokenize.js'

const
Symbolic	= _ => [
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
,	`=>`
].includes( _ )

const
IsRegEX		= _ => _.at( 0 ) === '/' && _.at( -1 ) === '/'

const
IsString	= _ => OpenString.includes( _.at( 0 ) )

const
AfterNL		= _ => [
	'const', 'let', 'var', 'break'
].includes( _ )

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
			,	Ts[ _ ] === '\n' && $.push( [] )
			) :	T === ',' ?(
				body.length && $.push( body )
			,	body = [ T ]
			) :	T === ';' ?(
				$.push( [ ...body, T ] )
			,	body = []
			) :	T === '\n' ?(
				body.length && $.push( body )
			,	body = []
			) :	body.push( T )
		}
		body.length && $.push( body )
		return $
	}
	return Trees()
}

const
Lines = ( trees, level = 0 ) => {

	let
	$ = []

	const
	Push = _ => $.push( [ _, level ] )

	const
	Append = ( _, separator = ' ' ) => $.length
	?	$[ $.length - 1 ][ 0 ] += $.at( -1 )[ 0 ] ? ( separator + _ ) : _
	:	Push( _ )

	const
	Make = _ => _.length
	?	_[ 0 ] === '.'
		?	'.' + Make( _.slice( 1 ) )
		:	_.length > 1
			?	_[ 0 ] + ' ' + Make( _.slice( 1 ) )
			:	_[ 0 ]
	:	''

	const
	Pre = _ => _[ 0 ] === ','
	?	$.push( [ ',\t' + Make( _.slice( 1 ) ), level - 1 ] )
	:	Symbolic( _[ 0 ] )
		?	Append( Make( _ ) )
		:	(	Push( _[ 0 ] )
			,	_.length > 1 && Append( Make( _.slice( 1 ) ) )
			)

	for ( const tree of trees ) {
		if ( Array.isArray( tree ) ) {
			tree.length
			?	Pre( tree )
			:	Push( '' )
		} else {
			const
			{ body, open, subTrees } = tree
			const
			close = CorrParen( open )

			body.length && Pre( body )
			Append( open )

			const
			lines = Lines( subTrees, level + 1 ).filter( _ => _[ 0 ].length )

			lines.length == 0
			?	Append( close, '' )
			:	lines.length == 1
				?	Append( lines[ 0 ][ 0 ] + ' ' + close )
				:	(	$.at( -1 )[ 0 ].length < 4
						?	Append( lines[ 0 ][ 0 ], '\t' )
						:	$.push( lines[ 0 ] )
					,	$.push( ...lines.slice( 1 ) )
					,	Push( close )
					)
		}
	}
	return $
}

/*
const
Make = _ => Lines( MakeTrees( Tokenize( _ ) ) ).reduce(
	( $, _ ) => $ + '\t'.repeat( _[ 1 ] ) + _[ 0 ] + '\n'
,	''
)
*/
const
Make = _ => {
	const
	trees = MakeTrees( Tokenize( _ ) )
	console.error( JSON.stringify( trees, null, '\t' ) )
	return Lines( trees ).reduce(
		( $, _ ) => $ + '\t'.repeat( _[ 1 ] ) + _[ 0 ] + '\n'
	,	''
	)
}

//const
//S = _ => JSON.stringify( _, null, '\t' )

import fs from 'fs'

fs.writeFileSync(
	'/dev/stdout'
,	Make( fs.readFileSync( '/dev/stdin', 'utf8' ) )
)

