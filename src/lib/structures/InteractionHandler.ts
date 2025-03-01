import { Piece } from '@sapphire/pieces';
import { Option } from '@sapphire/result';
import type { Awaitable } from '@sapphire/utilities';
import type { Interaction } from 'discord.js';
import type { InteractionHandlerStore } from './InteractionHandlerStore';

export abstract class InteractionHandler<O extends InteractionHandler.Options = InteractionHandler.Options> extends Piece<O> {
	/**
	 * The {@link InteractionHandlerStore} that contains this {@link InteractionHandler}.
	 */
	public declare store: InteractionHandlerStore;

	/**
	 * The type for this handler
	 * @since 3.0.0
	 */
	public readonly interactionHandlerType: InteractionHandlerTypes;

	public constructor(context: Piece.Context, options: InteractionHandlerOptions) {
		super(context, options);

		this.interactionHandlerType = options.interactionHandlerType;
	}

	public abstract run(interaction: Interaction, parsedData?: unknown): unknown;

	/**
	 * A custom function that will be called when checking if an interaction should be passed to this handler.
	 * You can use this method to not only filter by ids, but also pre-parse the data from the id for use in the run method.
	 *
	 * By default, all interactions of the type you specified will run in a handler. You should override this method
	 * to change that behavior.
	 *
	 * @example
	 * ```typescript
	 * // Parsing a button handler
	 * public override parse(interaction: ButtonInteraction) {
	 *   if (interaction.customId.startsWith('my-awesome-clicky-button')) {
	 * 	   // Returning a `some` here means that the run method should be called next!
	 *     return this.some({ isMyBotAwesome: true, awesomenessLevel: 9001 });
	 *   }
	 *
	 *   // Returning a `none` means this interaction shouldn't run in this handler
	 *   return this.none();
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Getting data from a database based on the custom id
	 * public override async parse(interaction: ButtonInteraction) {
	 *   // This code is purely for demonstration purposes only!
	 *   if (interaction.customId.startsWith('example-data')) {
	 *     const [, userId, channelId] = interaction.customId.split('.');
	 *
	 * 	   const dataFromDatabase = await container.prisma.exampleData.findFirst({ where: { userId, channelId } });
	 *
	 *     // Returning a `some` here means that the run method should be called next!
	 *     return this.some(dataFromDatabase);
	 *   }
	 *
	 *   // Returning a `none` means this interaction shouldn't run in this handler
	 *   return this.none();
	 * }
	 * ```
	 *
	 * @returns An {@link Option} (or a {@link Promise Promised} {@link Option}) that indicates if this interaction should be
	 * handled by this handler, and any extra data that should be passed to the {@link InteractionHandler.run run method}
	 */
	public parse(_interaction: Interaction): Awaitable<Option<unknown>> {
		return this.some();
	}

	public some(): Option.Some<never>;
	public some<T>(data: T): Option.Some<T>;
	public some<T>(data?: T): Option.Some<T | undefined> {
		return Option.some(data);
	}

	public none(): Option.None {
		return Option.none;
	}

	public override toJSON(): InteractionHandlerJSON {
		return {
			...super.toJSON(),
			interactionHandlerType: this.interactionHandlerType
		};
	}
}

export interface InteractionHandlerOptions extends Piece.Options {
	/**
	 * The type of interaction this handler is for. Must be one of {@link InteractionHandlerTypes}.
	 */
	readonly interactionHandlerType: InteractionHandlerTypes;
}

export interface InteractionHandlerJSON extends Piece.JSON {
	interactionHandlerType: InteractionHandlerTypes;
}

export type InteractionHandlerParseResult<Instance extends InteractionHandler> = Option.UnwrapSome<Awaited<ReturnType<Instance['parse']>>>;

export namespace InteractionHandler {
	export type Context = Piece.Context;
	export type Options = InteractionHandlerOptions;
	export type JSON = InteractionHandlerJSON;
	export type ParseResult<Instance extends InteractionHandler> = InteractionHandlerParseResult<Instance>;
}

export enum InteractionHandlerTypes {
	// Specifically focused types
	Button,
	SelectMenu,
	ModalSubmit,

	// More free-falling handlers, for 1 shared handler between buttons and select menus (someone will have a use for this >,>)
	MessageComponent,
	// Optional autocompletes, you can use this or in-command
	Autocomplete
}
