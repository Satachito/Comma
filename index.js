const
StringOpener	= _ => _.match( /['"`\/]/ )

const
RemoveComments = source => {
	let	inS = null
	let $ = ''
	let _ = 0
	while ( _ < source.length ) {
		if ( inS ) {
			const
			C = source[ _++ ]
			$ += C
			C === '\\' && _ < source.length && ( $ += source[ _++ ] )
			C === inS && ( inS = null )
		} else {
			switch ( source.slice( _, _ + 2 ) ) {
			case '/*'	:
				_ += 2
				while ( _ < source.length - 1 ) {
					if ( source[ _++ ] === '*' && source[ _++ ] === '/' ) break
				}
				break
			case '//'	:
				_ += 2
				while ( _ < source.length ) {
					if ( source[ _++ ] === '\n' ) {
						$ += '\n'
						break
					}
				}
				break
			default		:
				{	const
					C = source[ _++ ]
					$ += C
					StringOpener( C ) && ( inS = C )
				}
				break
			}
		}
	}
	return $
}

const
source = RemoveComments( ( await import( 'fs' ) ).readFileSync( '/dev/stdin', 'utf8' ) )

const
T = []

const
WordElement		= _ => _.match( /[A-Za-z0-9_\$]/ )
const
SpaceLike		= _ => _.match( /\s/ )
const
OpenParen		= _ => _.match( /[\[\(\{]/ )
const
CloseParen		= _ => _.match( /[\]\)\}]/ )
const
ParenDeli		= _ => CloseParen( _ ) || OpenParen( _ ) || _.match( /[,;]/ )
const
Operator		= _ => !( StringOpener( _ ) || WordElement( _ ) || SpaceLike( _ ) || ParenDeli( _ ) )


let
word = ''

let
string = null
let
inESC = false

let
pC	//	previous C

for ( const C of source ) {

	string
	?	inESC
		?	( string += C, inESC = false )
		:	C === string[ 0 ]
			?	( T.push( string + string[ 0 ] ), string = null )
			:	( string += C, C === '\\' && ( inESC = true ) )
	:	StringOpener( C )
		?	string = C
		:	WordElement( C )	//	NOT IN STRING
			?	word += C
			:	(
				word.length && ( T.push( word ), word = '' )
			,	SpaceLike( C )
				?	C === '\n' && T.push( C )
				:	ParenDeli( C )
					?	T.push( C )
					:	Operator( pC )
						?	( T[ T.length - 1 ] += C )
						:	T.push( C )
			)
	;

	pC = C
}


/*
比較：==, !=, ===, !==, <=, >=
論理：&&, ||, ??
代入：+=, -=, *=, /=, **=, &&=, ||=, ??=
ビット：<<, >>, >>>, &=, |=, ^=
その他：=>, **, ...
*/

//	console.log( T.slice( 0, 32 ) )

const W		= _ => process.stdout.write( _ )
const NW	= _ => W( '\n' + _ )
const WN	= _ => W( _ + '\n' )
const NWN	= _ => W( '\n' + _ + '\n' )

let
iL = 0
const
Indent = () => W( '\t'.repeat( iL ) )

let
newLine = true


for ( let _ = 0; _ < T.length; _++ ) {
	const
	$ = T[ _ ]

	if ( $ === '\n' ) continue

	if ( newLine ) {
		newLine = false
		Indent()
	}

	if ( false ) {}
	else if ( OpenParen( $[ 0 ] )	) ( WN( $ ), iL++, newLine = true )
	else if ( CloseParen( $[ 0 ] )	) ( NWN( $ ), --iL, newLine = true )
	else if ( $ === '.'			) W( '.' )
	else if ( $ === ','			) W( ', ' )
	else if ( $ === ';'			) _ < T.length - 1 && OpenParen( T[ _ + 1 ] ) && W( $ )
	else if ( Operator( $ )		) W( ' ' + $ + ' ' )
	else if (
		$ === 'const'
	||	$ === 'let'
	||	$ === 'var'
	)( W( '\n' + $ + '\n' ), indent = true )
	else if (
		$ === 'return'
	) W( $ + ' ' )
	else W( $ )
}
/*
console.log( $ )
$.forEach(
	_ => process.stdout.write( _ === '\n' ? _ : _ + ' ' )
)
*/
