import { CustomEnum } from "@serenityjs/command";
import Emitter from "@serenityjs/emitter";
import { Serenity } from "@serenityjs/serenity";
import { Dimension, Entity, EntityScaleComponent, Player, WorldEvent } from "@serenityjs/world";
import { CommandPermissionLevel, Rotation, Vector3f } from "@serenityjs/protocol";
import { EntityIdentifier, EntityType } from "@serenityjs/entity";
import { EntitySlapperComponent } from "./component";
import { ActionForm, ModalForm } from "@serenityjs/server-ui";

interface SlapperEvents {
  Slap: [];
}

class SlapperEnum extends CustomEnum {
  public static readonly name = "SlapperEnum";
  public static readonly options = [ "create", "edit", "remove" ];
}

class Slapper extends Emitter<SlapperEvents> {
  protected readonly serenity: Serenity;

  public constructor(serenity: Serenity) {
    super();
    this.serenity = serenity;

    // Register the slapper commands
    serenity.worlds.on(WorldEvent.WorldInitialize, ({ world }) => {
      world.commands.register(
        "slapper",
        "Used to interact with the slapper plugin.",
        (origin, { action }) => {
          // Check if the origin is not a player
          if (!(origin instanceof Player))
            throw new Error("Only players can use this command.");

          // Switch the action
          switch (action.result) {
            case "create":
              this.handleCreateForm(origin);
              break;
            case "edit":
              this.handleEditFormSelect(origin);
              break;
            case "remove":
              break;
          }

          return {}
        },
        {
          action: SlapperEnum,
        },
        {
          permission: CommandPermissionLevel.Operator,
          special: true,
        }
      );
    });
  }

  protected handleCreateForm(player: Player): void {
    // Create a new form.
    const form = new ModalForm();

    const entities = EntityType.getAll();

    form.title = "Slapper | Create";

    form.label("This will create a slapper entity in the direction you are looking, and the position you are standing. You will be able to edit the slapper later using the §n/slapper edit§r command.\n");

    form.input("Entity Type:", "minecraft:zombie");
    form.input("Nametag:", "Slapper");

    form.show(player)
      .then((response) => {

        const identifier = response[1] as EntityIdentifier;
        const nametag = response[2] as string;

        // Check if the entity type is valid
        if (!identifier)
          return player.sendMessage("§cYou must provide a valid entity type.§r");

        // Check if the nametag is valid
        if (!nametag)
          return player.sendMessage("§cYou must provide a valid nametag.§r");

        // Get the position and rotation of the player
        const position = player.position;
        const rotation = player.rotation;
        position.y -= 1.5;

        // Create the slapper
        this.createSlapper(identifier, nametag, player.dimension, position, rotation);

        // Send the player a message
        player.sendMessage(`§aSlapper created!§r`);
      })
      .catch(() => {
        player.sendMessage("§cForm closed.§r");
      });
  }

  protected handleEditFormSelect(player: Player): void {
    // Get all the slappers in the current dimension
    const slappers = this.getSlappers(player.dimension);

    // Create a new form
    const form = new ActionForm();
    form.title = "Slapper | Edit";
    form.content = "Select a slapper you would like to edit.";

    // Add the slappers to the form
    for (const slapper of slappers) {
      // Get the position of the slapper
      const { x, y, z } = slapper.getEntity().position.floor();

      // Add the button to the form
      form.button(`${slapper.getNametag()}\nPosition: §n${x}, ${y}, ${z}§r`);
    }

    // Show the form to the player
    form.show(player)
      .then((response) => {
        // Get the slapper from the response
        const slapper = slappers[response] as EntitySlapperComponent;

        // Handle the edit form
        this.handleEditForm(player, slapper);
      })
      .catch(() => {
        player.sendMessage("§cForm closed.§r");
      });
  }

  protected handleEditForm(player: Player, slapper: EntitySlapperComponent): void {
    // Create a new form
    const form = new ModalForm();
    form.title = "Slapper | Edit";
    form.label("Edit the slapper below. You can added multiple commands by separating them with a semicolon.\n");
    form.input("Nametag:", slapper.getNametag());
    form.input("Commands:", slapper.commands.join(";"));
    form.slider("Size", 1, 10);

    // Show the form to the player
    form.show(player)
      .then((response) => {
        const nametag = response[1] as string ?? slapper.getNametag();
        const commands = response[2] as string ?? slapper.commands.join(";");
        const size = response[3] ?? 1;

        // Check if the nametag is valid
        if (!nametag)
          return player.sendMessage("§cYou must provide a valid nametag.§r");

        // Set the nametag of the slapper
        slapper.getEntity().setNametag(nametag);

        // Set the commands of the slapper
        slapper.commands = commands.split(";");

        // Set the size of the slapper
        const scale = new EntityScaleComponent(slapper.getEntity());
        scale.setCurrentValue(size);

        // Send the player a message
        player.sendMessage(`§aSlapper updated!§r`);
      })
      .catch(() => {
        player.sendMessage("§cForm closed.§r");
      });
  }

  public createSlapper(identifier: EntityIdentifier, nametag: string, dimension: Dimension, position: Vector3f, rotation: Rotation): EntitySlapperComponent {
    // Create the entity
    const entity = new Entity(identifier, dimension);

    // Set the nametag of the entity
    entity.setNametag(nametag);

    // Create the component
    const component = new EntitySlapperComponent(entity);

    // Set the position and rotation of the entity
    entity.position.x = position.x;
    entity.position.y = position.y;
    entity.position.z = position.z;

    // Set the rotation of the entity
    entity.rotation.yaw = rotation.yaw;
    entity.rotation.pitch = rotation.pitch;
    entity.rotation.headYaw = rotation.headYaw;

    // Spawn the entity
    entity.spawn();

    // Return the component
    return component;
  }

  public getSlappers(dimension: Dimension): Array<EntitySlapperComponent> {
    // Get all the entities in the dimension that have the slapper component
    const entities = dimension.getEntities()
      .filter(entity => entity.components.has(EntitySlapperComponent.identifier));

    // Return the components
    return entities.map(entity => entity.components.get(EntitySlapperComponent.identifier) as EntitySlapperComponent);
  }
}

export { Slapper };