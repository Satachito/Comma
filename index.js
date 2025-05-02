const
SymbolC		= /[+\-*/%=<>!~&|^?:.]/

const
OpenParen	= /[\[\(\{]/

const
CloseParen	= /[\]\)\}]/

const
OpenString	= /[`"']/

const
Tokenize	= S => {	//	Source

	const	$	= []
	let		_	= 0

	const
	ReadRemain	= ( closer, extra ) => {	//	`closer` accepts RegEX
		let $ = ''
		while( _ < S.length ) {
			const
			C = S[ _++ ]
			$ += C
			if( C.match( closer ) ) break
			if( C === '\\' ) {
				_ < S.length && ( $ += S[ _++ ] )
				continue
			}
			if( extra ) {
				$ += extra( C )
				continue
			}
		}
		return $
	}

	const
	ReadSymbolRemain = () => {
		let
		$ = ''
		while( _ < S.length ) {
			if( S[ _ ].match( SymbolC ) ) $ += S[ _++ ]
			else break
		}
		return $
	}

	let
	word = ''
	while( _ < S.length ) {

		const
		C = S[ _++ ]

		if( C === '/' ) {
			word && ( $.push( word ), word = '' )
			if( _ < S.length && S[ _ ] === '*' ) {
				_ += 2
				while( _ < S.length - 1 ) if( S[ _++ ] === '*' && S[ _++ ] === '/' ) break
				continue
			}
			if( _ < S.length && S[ _ ] === '/' ) {
				_ += 2
				while( _ < S.length ) if( S[ _++ ] === '\n' ) break
				continue
			}
			const _Saved = _
			const RE = ReadRemain(
				/[\/\n]/
			,	_ => _ === '['
				?	ReadRemain( ']' )
				:	''
			)
			if( RE.at( -1 ) === '/' ) $.push( C + RE )
			else {
				_ = _Saved
				$.push( C + ReadSymbolRemain() )
			}
			continue
		}

		if( C.match( SymbolC ) ) { 
			word && ( $.push( word ), word = '' )
			$.push( C + ReadSymbolRemain() )
			continue
		}

		if(	C.match( OpenString ) ) {
			word && ( $.push( word ), word = '' )
			$.push( C + ReadRemain( C ) )
			continue
		}

		if(	C === '\n' ) {
			word && ( $.push( word ), word = '' )
			$.length && $.at( -1 ) === C || $.push( C )
			continue
		}
		if(	C.match( /\s/ ) ) {
			word && ( $.push( word ), word = '' )
			continue
		}

		if(	C === ','
		||	C === ';'
		||	C.match( OpenParen )
		||	C.match( CloseParen )
		) {	word && ( $.push( word ), word = '' )
			$.push( C )
			continue
		}

		word += C
	}
	word && $.push( word )

	return $
}

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
IsSymbol	= _ => [
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
IsString	= _ => _.at( 0 ).match( OpenString )

const
MakeTrees	= Ts => {
	let _ = 0

	const
	Trees = ( closer = null ) => {
		const	$ = []
		let		pre = ''
		while ( _ < Ts.length ) {

			const T = Ts[ _++ ]
			if( T === closer ) break

			if( T[ 0 ].match( OpenParen ) ) {
				$.push( [ pre, T, Trees( CorrParen( T ) ) ] )
				pre = ''
				continue
			}
			if( T === ';' ) {
				( $.push( pre + T ), pre = '' )
				continue
			}
			if( T === '\n' ) {
				pre && ( $.push( pre ), pre = '' )
				continue
			}
			if( T === ',' ) {
				pre && $.push( pre )
				pre = ','
				continue
			}

			if( T === '.' ) {
				pre += T
				continue
			}

			const
			delimit = () => pre !== ',' && pre && pre.at( -1 ) != '.' && ( pre += ' ' )

			//	i.e. Exclude identifier
			if(	IsReserved( T )
			||	IsString( T )
			||	IsRegEX( T )
			||	IsSymbol( T )
			) {	delimit()
				pre += T
				continue
			}
////////
			if ( _ && IsReserved( Ts[ _ - 1 ] ) ) {
				$.push( pre )
				pre = T
				continue
			}
			delimit()
			pre += T
		}
		pre && $.push( pre )
		return $
	}
	return Trees()
}

const
CorrParen	= _ => (
	{	'(':	')'
	,	'{':	'}'
	,	'[':	']'
	}[ _ ]
)

const
Lines = trees => {

	let
	$ = []

	const
	Append = _ => $.length ? ( $[ $.length - 1 ] += _ ) : $.push( _ )

	let
	ifw = false

	const
	IFW = _ => _ === 'if' || _ === 'while' || _ === 'for'

	const
	Identifier = _ => ifw && $.at( -1 ).at( -1 ).match( CloseParen )
	?	Append( ' ' + _ )
	:	$.push( _ )

	for ( const tree of trees ) {
		if ( tree.constructor === Array ) {
			const
			[ pre, open, subTrees ] = tree

			const
			openLS = ( ( IFW( pre ) || open === '{' ) ? ' ' : '' ) + open

			if(	pre === '' ) {
				Append( openLS )
			} else {
				const
				tree = pre + openLS
				if ( pre[ 0 ] === '.' ) {
					Append( tree )
				} else if( pre[ 0 ].match( SymbolC ) ) {
					Append( ' ' + tree )
				} else {
					Identifier( tree )
				}
			}

			ifw = IFW( pre )

			const
			lines = Lines( subTrees )

			switch ( lines.length ) {
			case 0:
				Append( CorrParen( open ) )
				break
			case 1:
				Append( ' ' + lines[ 0 ] + ' ' + CorrParen( open ) )
				break
			default:
				lines.forEach(
					line => $.push(
						line.length > 1 && line[ 0 ] === ',' && line[ 1 ] !== '\t'
						?	',\t' + line.slice( 1 )
						:	'\t' + line
					)
				)
				$.push( CorrParen( open ) )
				break
			}
		} else {
			$.length && tree === 'const' && $.push( '' )
			tree[ 0 ].match( SymbolC ) && $.length
			?	(	$[ $.length - 1 ] || ( $[ $.length - 1 ] += '\t' )
				,	$[ $.length - 1 ] += tree
				)
			:	Identifier( tree )

			ifw = false
		}
	}
	return $
}

const
Make = _ => Lines( MakeTrees( Tokenize( _ ) ) ).join( '\n' ) + '\n'

import fs from 'fs'

fs.writeFileSync(
	'/dev/stdout'
,	Make( fs.readFileSync( '/dev/stdin', 'utf8' ) )
)

